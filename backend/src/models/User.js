import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    role:{
        type:String,
        enum:["SPORT_ADMIN","CAPTAIN","VICE_CAPTAIN","STUDENT"],
        default:"STUDENT"
    },

    nic:{
        type:String,
        default:""
    },

    registrationNumber:{
        type:String,
        default:""
    },

    phone:{
        type:String,
        default:""
    },

    height:{
        type:Number,
        default:0
    },

    weight:{
        type:Number,
        default:0
    },

    extraSkills:{
        type:String,
        default:""
    },

    sport:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Sport",
        default:null
    }

},
{timestamps:true}
);

export default mongoose.model("User",userSchema);