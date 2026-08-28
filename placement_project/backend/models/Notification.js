import mongoose from "mongoose";
export default mongoose.model("Notification", new mongoose.Schema({
  recipient:{type:mongoose.Schema.Types.ObjectId,required:true},recipientType:{type:String,enum:["student","user"],default:"student"},title:String,message:String,type:String,read:{type:Boolean,default:false}
},{timestamps:true}));
