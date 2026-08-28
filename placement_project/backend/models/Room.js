import mongoose from "mongoose";
export default mongoose.model("Room", new mongoose.Schema({name:String,capacity:Number,location:String,availableSlots:[String]},{timestamps:true}));
