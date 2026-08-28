import mongoose from "mongoose";
export default mongoose.model("Eligibility", new mongoose.Schema({
 job:{type:mongoose.Schema.Types.ObjectId,ref:"Job"},student:{type:mongoose.Schema.Types.ObjectId,ref:"Student"},
 eligible:Boolean,reasons:[String],missingSkills:[String],aiExplanation:String,preparationAdvice:[String]
},{timestamps:true}));
