import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import Application from "./models/Application.js";
import Interview from "./models/Interview.js";

await connectDB();
await Application.updateMany({status:"Recommended"},{$set:{status:"AI_RECOMMENDED"}});
await Application.updateMany({status:"Not Recommended"},{$set:{status:"REJECTED"}});
await Interview.updateMany({status:"Pending Approval"},{$set:{status:"PENDING_ADMIN_APPROVAL"}});
await Interview.updateMany({status:"Approved"},{$set:{status:"SCHEDULED"}});
await Interview.updateMany({status:"Completed"},{$set:{status:"COMPLETED"}});
await Interview.updateMany({status:"Selected"},{$set:{status:"SELECTED"}});
await Interview.updateMany({status:"Not Selected"},{$set:{status:"NOT_SELECTED"}});
console.log("Placement status migration complete.");
process.exit(0);
