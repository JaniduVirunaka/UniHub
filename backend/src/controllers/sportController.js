import Sport from "../models/Sport.js";
import User from "../models/User.js";

export const createSport = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const sport = await Sport.create({
      name,
      description,
      category,
      createdBy: req.user._id
    });

    res.status(201).json(sport);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getSports = async (req, res) => {
  try {
    const sports = await Sport.find()
      .populate("captain", "name email role")
      .populate("viceCaptain", "name email role");

    res.json(sports);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getSportById = async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id)
      .populate("members", "name email role")
      .populate("captain", "name email role")
      .populate("viceCaptain", "name email role");

    if (!sport) {
      return res.status(404).json({
        message: "Sport not found"
      });
    }

    res.json(sport);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const updateSport = async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);

    if (!sport) {
      return res.status(404).json({
        message: "Sport not found"
      });
    }

    sport.name = req.body.name || sport.name;
    sport.description = req.body.description || sport.description;
    sport.category = req.body.category || sport.category;

    await sport.save();

    res.json(sport);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const deleteSport = async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);

    if (!sport) {
      return res.status(404).json({
        message: "Sport not found"
      });
    }

    await Sport.findByIdAndDelete(req.params.id);

    res.json({
      message: "Sport deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const assignCaptain = async (req, res) => {
  try {
    const { studentId } = req.body;

    const sport = await Sport.findById(req.params.id);

    if (!sport) {
      return res.status(404).json({
        message: "Sport not found"
      });
    }

    const isMember = sport.members.some(
      (memberId) => memberId.toString() === studentId
    );

    if (!isMember) {
      return res.status(400).json({
        message: "Selected student is not a member of this sport"
      });
    }

    if (sport.captain) {
      const oldCaptain = await User.findById(sport.captain);

      if (oldCaptain) {
        oldCaptain.role = "STUDENT";
        await oldCaptain.save();
      }
    }

    const newCaptain = await User.findById(studentId);

    if (!newCaptain) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    newCaptain.role = "CAPTAIN";
    await newCaptain.save();

    sport.captain = studentId;
    await sport.save();

    res.json({
      message: "Captain assigned successfully",
      captain: {
        id: newCaptain._id,
        name: newCaptain.name,
        email: newCaptain.email,
        role: newCaptain.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const assignViceCaptain = async (req, res) => {
  try {
    const { studentId } = req.body;

    const sport = await Sport.findById(req.params.id);

    if (!sport) {
      return res.status(404).json({
        message: "Sport not found"
      });
    }

    const isMember = sport.members.some(
      (memberId) => memberId.toString() === studentId
    );

    if (!isMember) {
      return res.status(400).json({
        message: "Selected student is not a member of this sport"
      });
    }

    if (sport.viceCaptain) {
      const oldViceCaptain = await User.findById(sport.viceCaptain);

      if (oldViceCaptain) {
        oldViceCaptain.role = "STUDENT";
        await oldViceCaptain.save();
      }
    }

    const newViceCaptain = await User.findById(studentId);

    if (!newViceCaptain) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    newViceCaptain.role = "VICE_CAPTAIN";
    await newViceCaptain.save();

    sport.viceCaptain = studentId;
    await sport.save();

    res.json({
      message: "Vice Captain assigned successfully",
      viceCaptain: {
        id: newViceCaptain._id,
        name: newViceCaptain.name,
        email: newViceCaptain.email,
        role: newViceCaptain.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const sport = await Sport.findById(id);

    if (!sport) {
      return res.status(404).json({
        message: "Sport not found"
      });
    }

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const isMember = sport.members.some(
      (memberId) => memberId.toString() === studentId
    );

    if (!isMember) {
      return res.status(400).json({
        message: "Student is not a member of this sport"
      });
    }

    sport.members = sport.members.filter(
      (memberId) => memberId.toString() !== studentId
    );

    if (sport.captain && sport.captain.toString() === studentId) {
      sport.captain = null;
      student.role = "STUDENT";
    }

    if (sport.viceCaptain && sport.viceCaptain.toString() === studentId) {
      sport.viceCaptain = null;
      student.role = "STUDENT";
    }

    student.sport = null;

    if (student.role !== "CAPTAIN" && student.role !== "VICE_CAPTAIN") {
      student.role = "STUDENT";
    }

    await sport.save();
    await student.save();

    res.json({
      message: "Member removed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};