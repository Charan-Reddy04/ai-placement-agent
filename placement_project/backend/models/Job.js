import mongoose from "mongoose";
export default mongoose.model("Job",new mongoose.Schema({
 company:{type:mongoose.Schema.Types.ObjectId,ref:"Company"},title:String,description:String,
 skills:[String],mandatorySkills:[String],preferredSkills:[String],branches:[String],
 minCgpa:Number,maxBacklogs:{type:Number,default:null},minExperienceMonths:{type:Number,default:0},
 graduationYear:Number,education:String,location:String,salary:String,openings:{type:Number,default:1},
 applicationDeadline:Date,interviewProcess:[String],interviewMode:{type:String,enum:["In-person","Online","Hybrid"],default:"In-person"},
 status:{type:String,default:"Open"},smartPlan:mongoose.Schema.Types.Mixed,requirementsConfirmed:{type:Boolean,default:false}
},{timestamps:true}));
