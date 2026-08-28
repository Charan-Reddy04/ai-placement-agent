import Notification from "../models/Notification.js";
import Student from "../models/Student.js";

export const list = async (req, res) => {
  if (req.user.role === "admin") {
    return res.json(await Notification.find().sort({ createdAt: -1 }));
  }

  const student = await Student.findOne({ user: req.user.id }).select("_id");
  if (!student) return res.status(404).json({ message: "Student profile not found" });

  res.json(await Notification.find({ recipient: student._id }).sort({ createdAt: -1 }));
};

export const create = async (req, res) =>
  res.status(201).json(await Notification.create(req.body));

export const markRead = async (req,res) => {
  const student = req.user.role === "student" ? await Student.findOne({user:req.user.id}).select("_id") : null;
  const filter = req.user.role === "student" ? {_id:req.params.id, recipient:student?._id, recipientType:"student"} : {_id:req.params.id};
  const n = await Notification.findOneAndUpdate(filter,{read:true},{new:true});
  if(!n) return res.status(404).json({message:"Notification not found"});
  res.json(n);
};
