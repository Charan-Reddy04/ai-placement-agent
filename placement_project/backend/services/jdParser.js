import { askAI } from "./aiService.js";
import { expandSkills, canonicalSkill } from "./skillService.js";

const known = [
  "javascript",
  "typescript",
  "react",
  "node.js",
  "mongodb",
  "express.js",
  "sql",
  "python",
  "java",
  "c++",
  "dsa",
  "docker",
  "aws",
  "communication",
  "git",
  "html",
  "css",
  "next.js",
  "angular",
  "spring boot",
  "figma",
  "linux",
  "kubernetes"
];

function uniqueSkills(skills = []) {
  return [
    ...new Set(
      (Array.isArray(skills) ? skills : [skills])
        .filter(Boolean)
        .flatMap((skill) => expandSkills([skill]))
        .map(canonicalSkill)
        .filter(Boolean)
    )
  ];
}

// Detect the "known" concrete skills (plus MERN/MEAN stack aliases)
// mentioned anywhere in a chunk of text.
function detectSkillsIn(text = "") {
  const detected = [];
  for (const skill of known) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) detected.push(skill);
  }
  if (/\bmern(?:\s+stack)?\b/i.test(text)) detected.push("mern");
  if (/\bmean(?:\s+stack)?\b/i.test(text)) detected.push("mean");
  return detected;
}

// Sentences that signal a "nice to have" rather than a hard requirement.
const PREFERRED_CUE = /\b(prefer|preferred|preferably|nice to have|good to have|bonus|plus point|added advantage|is a plus)\b/i;
// Sentences that explicitly signal a hard requirement.
const REQUIRED_CUE = /\b(required|must have|mandatory|should have|need to have|needs to have|looking for|strong knowledge of)\b/i;

function deterministicParse(text = "") {
  const lower = String(text).toLowerCase();

  const detected = detectSkillsIn(text);
  const skills = uniqueSkills(detected);

  // Split into sentences so skills mentioned in a "preferred"/"bonus"
  // sentence aren't treated as mandatory just because they also appear
  // in the overall skill list - this keeps eligibility (hard gate) from
  // rejecting a candidate over a merely-preferred skill they lack.
  const sentences = String(text).split(/(?<=[.\n])/).filter(Boolean);
  const preferredSet = new Set();
  const requiredSet = new Set();
  for (const sentence of sentences) {
    const sentenceSkills = uniqueSkills(detectSkillsIn(sentence));
    if (!sentenceSkills.length) continue;
    if (PREFERRED_CUE.test(sentence)) {
      sentenceSkills.forEach((s) => preferredSet.add(s));
    } else if (REQUIRED_CUE.test(sentence)) {
      sentenceSkills.forEach((s) => requiredSet.add(s));
    }
  }
  // A skill explicitly called out as required always counts as mandatory,
  // even if it also happens to be mentioned in a preferred-skills sentence.
  // Otherwise: anything not flagged "preferred" defaults to mandatory when
  // at least one required/preferred cue was found in the JD at all;
  // if neither cue appears anywhere, fall back to treating every detected
  // skill as mandatory (matches prior behaviour for terse JDs).
  const hasCues = requiredSet.size > 0 || preferredSet.size > 0;
  const mandatorySkills = uniqueSkills(
    skills.filter((s) => requiredSet.has(s) || (hasCues && !preferredSet.has(s)))
  );

  const cgpaMatch = text.match(
    /(?:minimum\s+)?(?:cgpa|gpa)[^0-9]*(\d(?:\.\d)?)/i
  );

  const backlogsMatch =
    text.match(/(?:maximum\s+)?(?:backlogs?|arrears)[^0-9]*(\d+)/i) ||
    (/\bno\s+(?:active\s+)?(?:backlogs?|arrears)\b/i.test(text) ? ["", "0"] : null);

  const expMatch = text.match(
    /(?:minimum\s+)?(?:experience|exp)[^0-9]*(\d+(?:\.\d+)?)\s*(months?|years?)/i
  );

  let minExperienceMonths = 0;

  if (expMatch) {
    const value = Number(expMatch[1]);
    minExperienceMonths = /year/i.test(expMatch[2])
      ? Math.round(value * 12)
      : Math.round(value);
  }

  const branches = [
    "CSE",
    "IT",
    "ECE",
    "EEE",
    "ME",
    "Civil"
  ].filter((branch) =>
    new RegExp(`\\b${branch}\\b`, "i").test(text)
  );

  return {
    title: "",
    skills,
    mandatorySkills,
    minCgpa: cgpaMatch ? Number(cgpaMatch[1]) : 0,
    maxBacklogs: backlogsMatch ? Number(backlogsMatch[1]) : null,
    minExperienceMonths,
    branches,
    location: "",
    responsibilities: []
  };
}

export async function parseJD(text = "") {
  const fallback = deterministicParse(text);

  try {
    const ai = await askAI(
      `You are extracting structured placement requirements from a job description.

Return JSON exactly:

{
  "title": "",
  "skills": [],
  "mandatorySkills": [],
  "preferredSkills": [],
  "branches": [],
  "minCgpa": 0,
  "maxBacklogs": null,
  "minExperienceMonths": 0,
  "location": "",
  "responsibilities": []
}

RULES:

1. Extract ONLY information present in the job description.
2. Never invent requirements.
3. If the job mentions MERN or MERN Stack, expand it into:
   ["mongodb", "express.js", "react", "node.js"]
4. If the job explicitly requires React, Node.js, Express.js or MongoDB, include those concrete skills.
5. "skills" contains skills relevant to the job.
6. "mandatorySkills" contains ONLY skills explicitly required/mandatory.
7. Do not put academic requirements into skills.
8. Do not treat SQL or DSA as MERN skills.
9. If CGPA is not specified, return 0.
10. If maximum backlogs is not specified, return null.
11. If experience is not specified, return 0.
12. Return arrays even when empty.

JOB DESCRIPTION:
${text}`,
      { json: true }
    );

    if (!ai) {
      return fallback;
    }

    const aiSkills = Array.isArray(ai.skills) ? ai.skills : [];
    const aiPreferred = Array.isArray(ai.preferredSkills) ? ai.preferredSkills : [];
    const aiMandatory = Array.isArray(ai.mandatorySkills)
      ? ai.mandatorySkills
      : [];

    // IMPORTANT:
    // AI output + deterministic extraction are merged.
    // Therefore a temporary AI extraction mistake cannot erase
    // deterministic MERN detection.
    const skills = uniqueSkills([
      ...fallback.skills,
      ...aiSkills
    ]);

    let mandatorySkills = uniqueSkills(aiMandatory);

    // If the JD explicitly says MERN is required, make the concrete
    // MERN components mandatory as well.
    if (/\bmern(?:\s+stack)?\b/i.test(text)) {
      const mernSkills = uniqueSkills(["mern"]);

      const explicitlyRequired =
        /\b(required|must have|mandatory|should have|looking for)\b/i.test(
          text
        );

      if (explicitlyRequired) {
        mandatorySkills = uniqueSkills([
          ...mandatorySkills,
          ...mernSkills
        ]);
      }
    }

    return {
      title: ai.title || fallback.title || "",
      skills,

      // Never allow AI to accidentally remove deterministic mandatory
      // requirements.
      mandatorySkills,
      preferredSkills: uniqueSkills(aiPreferred.length ? aiPreferred : skills.filter((x) => !mandatorySkills.includes(x))),

      branches:
        Array.isArray(ai.branches) && ai.branches.length
          ? ai.branches
          : fallback.branches,

      minCgpa:
        Number.isFinite(Number(ai.minCgpa)) && Number(ai.minCgpa) > 0
          ? Number(ai.minCgpa)
          : fallback.minCgpa,

      maxBacklogs:
        ai.maxBacklogs === null ||
        ai.maxBacklogs === undefined ||
        ai.maxBacklogs === ""
          ? fallback.maxBacklogs
          : Number(ai.maxBacklogs),

      minExperienceMonths:
        Number.isFinite(Number(ai.minExperienceMonths))
          ? Number(ai.minExperienceMonths)
          : fallback.minExperienceMonths,

      location: ai.location || fallback.location || "",

      responsibilities:
        Array.isArray(ai.responsibilities)
          ? ai.responsibilities
          : fallback.responsibilities
    };
  } catch (e) {
    console.warn(
      "AI JD extraction failed; deterministic fallback used:",
      e.message
    );

    return fallback;
  }
}