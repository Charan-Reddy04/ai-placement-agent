import Student from "../models/Student.js";
import { expandSkills } from "./skillService.js";
import XLSX from "xlsx";

const HEADER_ALIASES = {
  studentid:"studentId","student id":"studentId",id:"studentId",name:"name","full name":"name",
  email:"email",phone:"phone",mobile:"phone",branch:"branch",department:"branch",course:"course",
  cgpa:"cgpa",gpa:"cgpa",backlogs:"backlogs",arrears:"backlogs",
  graduationyear:"graduationYear","graduation year":"graduationYear","grad year":"graduationYear",
  skills:"skills",certifications:"certifications",certificates:"certifications",projects:"projects",
  internships:"internships",resume:"resumeUrl","resume link":"resumeUrl","resume url":"resumeUrl",
  placementstatus:"placementStatus","placement status":"placementStatus",
  experiencemonths:"experienceMonths","experience months":"experienceMonths"
};
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PLACEMENT_STATUS=new Set(["Not Placed","In Process","Selected","Not Selected"]);
const headerKey=h=>String(h??"").trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
function mapHeaders(row){return row.map(h=>{const k=headerKey(h);return HEADER_ALIASES[k]||HEADER_ALIASES[k.replace(/\s/g,"")]||null;});}

export function parseSpreadsheet(buffer){
  const wb=XLSX.read(buffer,{type:"buffer",cellDates:false});
  const name=wb.SheetNames[0];
  return name?XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:"",raw:false}):[];
}
function record(headers,cells){
  const r={}; headers.forEach((k,i)=>{if(k){const v=String(cells[i]??"").trim();if(v)r[k]=v;}}); return r;
}
function num(v){if(v===undefined||v===null||String(v).trim()==="")return undefined;const n=Number(v);return Number.isFinite(n)?n:NaN;}

export async function importStudentsFromSpreadsheet(buffer,originalName=""){
  const rows=parseSpreadsheet(buffer), summary={total:0,imported:0,updated:0,duplicates:0,invalid:0,missingData:0,errors:[]};
  if(!rows.length)return {summary,created:[],updated:[]};
  const headers=mapHeaders(rows[0]), data=rows.slice(1).filter(r=>r?.some(v=>String(v??"").trim()!==""));
  summary.total=data.length;
  if(!headers.some(Boolean)){summary.invalid=summary.total;summary.errors.push("No recognized student columns found in the first worksheet.");return {summary,created:[],updated:[]};}
  const seen=new Set(),created=[],updated=[];
  for(let i=0;i<data.length;i++){
    const line=i+2,r=record(headers,data[i]);
    if(!r.name||!r.email){summary.invalid++;summary.errors.push(`Row ${line}: name and email are required.`);continue;}
    const email=r.email.toLowerCase();
    if(!EMAIL_RE.test(email)){summary.invalid++;summary.errors.push(`Row ${line}: invalid email "${r.email}".`);continue;}
    if(seen.has(email)){summary.duplicates++;summary.errors.push(`Row ${line}: duplicate email "${email}".`);continue;} seen.add(email);
    const cgpa=num(r.cgpa),backlogs=num(r.backlogs),year=num(r.graduationYear),exp=num(r.experienceMonths);
    if(Number.isNaN(cgpa)||cgpa<0||cgpa>10){summary.invalid++;summary.errors.push(`Row ${line}: invalid CGPA.`);continue;}
    if(Number.isNaN(backlogs)||backlogs<0||Number.isNaN(year)||Number.isNaN(exp)||exp<0){summary.invalid++;summary.errors.push(`Row ${line}: invalid numeric field.`);continue;}
    if(!r.branch||cgpa===undefined||year===undefined)summary.missingData++;
    const payload={name:r.name,email,studentId:r.studentId,phone:r.phone,branch:r.branch,course:r.course,cgpa,
      backlogs:backlogs??0,graduationYear:year,experienceMonths:exp??0,
      skills:r.skills?expandSkills(r.skills.split(/[,;|]/).map(x=>x.trim()).filter(Boolean)):undefined,
      certifications:r.certifications?r.certifications.split(/[,;|]/).map(x=>x.trim()).filter(Boolean):undefined,
      experienceDetails:[r.projects&&`Projects: ${r.projects}`,r.internships&&`Internships: ${r.internships}`].filter(Boolean).join(" | ")||undefined,
      resumeUrl:r.resumeUrl,placementStatus:VALID_PLACEMENT_STATUS.has(r.placementStatus)?r.placementStatus:undefined};
    Object.keys(payload).forEach(k=>payload[k]===undefined&&delete payload[k]);
    try{
      const existing=await Student.findOne({email});
      if(existing){Object.assign(existing,payload);await existing.save();updated.push(existing);summary.updated++;}
      else{const createdStudent=await Student.create(payload);created.push(createdStudent);summary.imported++;}
    }catch(e){summary.invalid++;summary.errors.push(`Row ${line}: ${e.message}`);}
  }
  return {summary,created,updated};
}
export const importStudentsFromCsv=importStudentsFromSpreadsheet;
