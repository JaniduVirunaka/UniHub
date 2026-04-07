import mongoose from "mongoose";

const sportSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

description:{
type:String,
default:""
},

category:{
type:String,
default:""
},

captain:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
default:null
},

viceCaptain:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
default:null
},

members:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
],

createdBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}

},
{timestamps:true}
);

export default mongoose.model("Sport",sportSchema);