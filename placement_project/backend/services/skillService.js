const aliases = {
  mern: ["mongodb", "express.js", "react", "node.js"],
  "mern stack": ["mongodb", "express.js", "react", "node.js"],
  reactjs: ["react"],
  "react js": ["react"],
  nodejs: ["node.js"],
  "node js": ["node.js"],
  expressjs: ["express.js"],
  "express js": ["express.js"],
  mongodb: ["mongodb"],
  javascript: ["javascript"],
  js: ["javascript"],
  typescript: ["typescript"],
  ts: ["typescript"],
  "next.js": ["next.js"],
  nextjs: ["next.js"],
  "c plus plus": ["c++"],
  cpp: ["c++"],
  sql: ["sql"],
  dsa: ["dsa", "data structures", "algorithms"],
  "data structures and algorithms": ["dsa"]
};

export function normalizeSkill(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function canonicalSkill(value = "") {
  const n = normalizeSkill(value);
  const map = {
    "express js": "express.js",
    expressjs: "express.js",
    // Bare short forms ("Express", "Node", "Next", "Mongo") are extremely
    // common in real job descriptions and admin-typed skill overrides.
    // Without these, canonicalSkill left them un-normalized and they never
    // matched "Express.js"/"Node.js"/"Next.js"/"MongoDB" or a MERN-derived
    // student skill set, silently failing an otherwise-satisfied match.
    express: "express.js",
    "node js": "node.js",
    nodejs: "node.js",
    node: "node.js",
    "react js": "react",
    reactjs: "react",
    "next js": "next.js",
    nextjs: "next.js",
    next: "next.js",
    mongo: "mongodb",
    js: "javascript",
    ts: "typescript",
    cpp: "c++",
    "c plus plus": "c++",
    "data structures and algorithms": "dsa"
  };
  return map[n] || n;
}

export function expandSkills(skills = []) {
  const out = new Set();
  for (const raw of Array.isArray(skills) ? skills : [skills]) {
    const n = canonicalSkill(raw);
    if (!n) continue;
    out.add(n);
    for (const alias of aliases[n] || []) out.add(canonicalSkill(alias));
  }
  return [...out];
}

export function skillEquivalent(a, b) {
  const A = canonicalSkill(a);
  const B = canonicalSkill(b);
  if (!A || !B) return false;
  if (A === B) return true;
  const ea = new Set(expandSkills([A]));
  const eb = new Set(expandSkills([B]));
  return ea.has(B) || eb.has(A);
}

export function matchSkills(requiredSkills = [], studentSkills = []) {
  const required = [...new Set((requiredSkills || []).map(canonicalSkill).filter(Boolean))];
  const student = expandSkills(studentSkills || []);
  const matched = [];
  const missing = [];
  for (const req of required) {
    if (student.some((s) => skillEquivalent(req, s))) matched.push(req);
    else missing.push(req);
  }
  return { required, student, matched, missing };
}
