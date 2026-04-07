import express from "express";
import {
  register,
  login,
  makeSportAdmin
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/make-sport-admin", makeSportAdmin);

export default router;