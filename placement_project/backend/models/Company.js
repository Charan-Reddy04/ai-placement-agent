import mongoose from "mongoose";
export default mongoose.model("Company", new mongoose.Schema({name:{type:String,required:true},website:String,contactEmail:String,industry:String},{timestamps:true}));
