import mongoose from "mongoose";
export default mongoose.model("Panel", new mongoose.Schema({name:String,members:[String],specialization:String,availableSlots:[String]},{timestamps:true}));
