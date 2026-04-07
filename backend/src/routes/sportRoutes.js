import express from "express";
import {
  createSport,
  getSports,
  getSportById,
  updateSport,
  deleteSport,
  assignCaptain,
  assignViceCaptain,
  removeMember
} from "../controllers/sportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getSports);
router.get("/:id", getSportById);

router.post(
  "/",
  protect,
  authorizeRoles("SPORT_ADMIN"),
  createSport
);

router.put(
  "/:id",
  protect,
  authorizeRoles("SPORT_ADMIN"),
  updateSport
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("SPORT_ADMIN"),
  deleteSport
);

router.put(
  "/:id/assign-captain",
  protect,
  authorizeRoles("SPORT_ADMIN"),
  assignCaptain
);

router.put(
  "/:id/assign-vice-captain",
  protect,
  authorizeRoles("SPORT_ADMIN"),
  assignViceCaptain
);

router.put(
  "/:id/remove-member/:studentId",
  protect,
  authorizeRoles("SPORT_ADMIN"),
  removeMember
);

export default router;