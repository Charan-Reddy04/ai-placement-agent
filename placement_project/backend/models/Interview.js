import mongoose from "mongoose";
export default mongoose.model("Interview", new mongoose.Schema({
  application:{type:mongoose.Schema.Types.ObjectId,ref:"Application",index:true},
  job:{type:mongoose.Schema.Types.ObjectId,ref:"Job",required:true},
  student:{type:mongoose.Schema.Types.ObjectId,ref:"Student",required:true},
  panel:{type:mongoose.Schema.Types.ObjectId,ref:"Panel"},room:{type:mongoose.Schema.Types.ObjectId,ref:"Room"},
  date:String,time:String,durationMinutes:{type:Number,default:60},
  round:{type:String,default:"Technical"},mode:{type:String,enum:["In-person","Online","Hybrid"],default:"In-person"},
  meetingLink:String,status:{type:String,enum:["AI_RECOMMENDED","PENDING_ADMIN_APPROVAL","REJECTED","APPROVED","SCHEDULED","REMINDER_SENT","COMPLETED","SELECTED","NOT_SELECTED"],default:"PENDING_ADMIN_APPROVAL"},
  aiPlan:mongoose.Schema.Types.Mixed,approvalNote:String,reminderSent:{type:Boolean,default:false},reminderTypes:[String]
},{timestamps:true}));
