import express from "express";
import {
  createRequest,
  getMyRequests,
  getRequestsBySport,
  approveRequest,
  rejectRequest
} from "../controllers/requestController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/:sportId",
  protect,
  authorizeRoles("STUDENT"),
  createRequest
);

router.get(
  "/my",
  protect,
  authorizeRoles("STUDENT"),
  getMyRequests
);

router.get(
  "/sport/:sportId",
  protect,
  authorizeRoles("SPORT_ADMIN", "CAPTAIN", "VICE_CAPTAIN"),
  getRequestsBySport
);

router.put(
  "/:requestId/approve",
  protect,
  authorizeRoles("SPORT_ADMIN", "CAPTAIN", "VICE_CAPTAIN"),
  approveRequest
);

router.put(
  "/:requestId/reject",
  protect,
  authorizeRoles("SPORT_ADMIN", "CAPTAIN", "VICE_CAPTAIN"),
  rejectRequest
);

export default router;