const JoinRequest = require('../models/JoinRequest');
const Sport = require('../models/Sport');
const User = require('../models/User');

const canManage = async (user, sportId) => {
  if (user.role === 'sport_admin') return true;
  const sport = await Sport.findById(sportId);
  if (!sport) return false;
  if (user.role === 'captain' && sport.captain && sport.captain.toString() === user._id.toString()) return true;
  if (user.role === 'vice_captain' && sport.viceCaptain && sport.viceCaptain.toString() === user._id.toString()) return true;
  return false;
};

const createRequest = async (req, res) => {
  try {
    const sportId = req.params.sportId;
    const { nic, name, registrationNumber, email, phone, height, weight, extraSkills } = req.body;

    const sport = await Sport.findById(sportId);
    if (!sport) return res.status(404).json({ message: 'Sport not found' });

    const existing = await JoinRequest.findOne({ sport: sportId, student: req.user._id });
    if (existing) return res.status(400).json({ message: 'Request already sent' });

    const request = await JoinRequest.create({ sport: sportId, student: req.user._id, nic, name, registrationNumber, email, phone, height, weight, extraSkills });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ student: req.user._id }).populate('sport', 'name');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRequestsBySport = async (req, res) => {
  try {
    const sportId = req.params.sportId;
    const allowed = await canManage(req.user, sportId);
    if (!allowed) return res.status(403).json({ message: 'Access denied for this sport' });

    const requests = await JoinRequest.find({ sport: sportId })
      .populate('student', 'name email role')
      .populate('sport', 'name');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveRequest = async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const allowed = await canManage(req.user, request.sport);
    if (!allowed) return res.status(403).json({ message: 'Access denied for this sport' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'APPROVED';
    request.approvedBy = req.user._id;
    await request.save();

    const sport = await Sport.findById(request.sport);
    if (sport && !sport.members.some(id => id.toString() === request.student.toString())) {
      sport.members.push(request.student);
      await sport.save();
    }

    const student = await User.findById(request.student);
    if (student) { student.sport = request.sport; await student.save(); }

    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const allowed = await canManage(req.user, request.sport);
    if (!allowed) return res.status(403).json({ message: 'Access denied for this sport' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'REJECTED';
    request.approvedBy = req.user._id;
    await request.save();

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRequest, getMyRequests, getRequestsBySport, approveRequest, rejectRequest };
