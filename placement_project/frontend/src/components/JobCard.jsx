import React,{useState} from "react";
import { Building2, MapPin, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { pick } from "../utils/normalize";

export default function JobCard({ job, isStudent=false, onApply }) {
  const company = pick(job, ["company.name", "companyName", "company"], "Company");
  const location = pick(job, ["location", "city"], "Campus");
  const role = pick(job, ["title", "role", "position"], "Untitled role");
  const ctc = pick(job, ["ctc", "package", "salary"]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const eligibility=job.eligibility;
  const application=job.application;

  async function apply(){
    if(!onApply||busy)return;
    setBusy(true);setMessage("");
    try{const result=await onApply(job._id);setMessage(result?.message||"Application submitted");}
    catch(e){setMessage(e.response?.data?.message||"Could not submit application");}
    finally{setBusy(false);}
  }

  return (
    <div className="entity-card" style={{"--accent":eligibility?.eligible?"var(--green)":"var(--violet)"}}>
      <div className="entity-card-top">
        <div><h4>{role}</h4><div className="sub">{company}</div></div>
        <StatusBadge status={job.status || "Open"} />
      </div>
      <div className="meta-row">
        <span><Building2 size={13} /> {company}</span><span><MapPin size={13} /> {location}</span>{ctc && <span>💰 {ctc}</span>}
      </div>
      {isStudent && (
        <div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <b style={{fontSize:13}}>Eligibility</b>
            {eligibility?.eligible ? <span className="badge badge-green"><CheckCircle2 size={12}/> Eligible</span> : <span className="badge badge-rose"><XCircle size={12}/> Not eligible</span>}
          </div>
          {eligibility && <small style={{display:"block",marginTop:7,color:"var(--text-muted)"}}>{eligibility.eligible ? `Eligibility score ${eligibility.score}% · matched ${eligibility.matchedSkills?.length||0} required skills.` : (eligibility.reasons||[]).slice(0,2).join(" · ")}</small>}
          {application?.studentApplied ? <div style={{marginTop:10}} className="badge badge-sky">Application submitted · {application.status}</div> : eligibility?.eligible && <button className="btn btn-primary" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={apply} disabled={busy}>{busy?"Submitting…":"Apply for this opportunity"}</button>}
          {message && <small style={{display:"block",marginTop:8,color:"var(--text-muted)"}}>{message}</small>}
          {application?.matchScore!=null && <div style={{marginTop:9,display:"flex",gap:8,alignItems:"center"}}><Sparkles size={13}/><small>AI match score: <b>{application.matchScore}%</b></small></div>}
        </div>
      )}
    </div>
  );
}
