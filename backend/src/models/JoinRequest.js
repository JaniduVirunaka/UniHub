import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({

sport:{
type:mongoose.Schema.Types.ObjectId,
ref:"Sport",
required:true
},

student:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

nic:{
type:String,
required:true
},

name:{
type:String,
required:true
},

registrationNumber:{
type:String,
required:true
},

email:{
type:String,
required:true
},

phone:{
type:String,
required:true
},

height:{
type:Number,
required:true
},

weight:{
type:Number,
required:true
},

extraSkills:{
type:String,
default:""
},

status:{
type:String,
enum:["PENDING","APPROVED","REJECTED"],
default:"PENDING"
},

approvedBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
default:null
}

},
{timestamps:true}
);

export default mongoose.model("JoinRequest",joinRequestSchema);