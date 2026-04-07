import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import sportRoutes from "./routes/sportRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/sports",sportRoutes);
app.use("/api/requests",requestRoutes);
app.get("/", (req, res) => {
  res.send("Sports Management Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/api/test",protect,(req,res)=>{

res.json({

message:"Protected route working",
user:req.user

});

});