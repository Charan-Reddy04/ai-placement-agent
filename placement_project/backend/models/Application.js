import mongoose from "mongoose";
const applicationSchema = new mongoose.Schema({
  job:{type:mongoose.Schema.Types.ObjectId,ref:"Job",required:true,index:true},
  student:{type:mongoose.Schema.Types.ObjectId,ref:"Student",required:true,index:true},
  matchScore:Number, aiScore:Number, matchedSkills:[String], missingSkills:[String],
  explanation:String, interviewFocus:[String],
  studentApplied:{type:Boolean,default:false,index:true}, appliedAt:Date,
  applicationSource:{type:String,enum:["AI_RECOMMENDATION","STUDENT_APPLICATION","BOTH"],default:"AI_RECOMMENDATION"},
  status:{type:String,enum:["AI_RECOMMENDED","PENDING_ADMIN_APPROVAL","REJECTED","APPROVED","SCHEDULED","COMPLETED","SELECTED","NOT_SELECTED"],default:"AI_RECOMMENDED"},
  adminNote:String, approvedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, approvedAt:Date,
  rejectedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, rejectedAt:Date
},{timestamps:true});
applicationSchema.index({job:1,student:1},{unique:true});
export default mongoose.model("Application",applicationSchema);
