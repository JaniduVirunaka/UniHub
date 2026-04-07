import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {

    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {

            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            req.user = await User.findById(decoded.id).select("-password");

            next();

        } else {

            return res.status(401).json({
                message: "Not authorized"
            });

        }

    } catch (error) {

        res.status(401).json({
            message: "Token failed"
        });

    }

};


export const makeSportAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.role = "SPORT_ADMIN";
    await user.save();

    res.json({
      message: "User promoted to SPORT_ADMIN successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};