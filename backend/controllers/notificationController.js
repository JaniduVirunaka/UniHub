const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate({ _id: id, recipient: req.user._id }, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
