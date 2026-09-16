import notificationService from "../services/notification.service.js";

const getNotifications = async (
  req,
  res
) => {
  const notifications =
    await notificationService.getUserNotifications(
      req.user._id
    );

  return res.status(200).json({
    success: true,
    notifications,
  });
};

const getUnreadCount = async (
  req,
  res
) => {
  const count =
    await notificationService.getUnreadCount(
      req.user._id
    );

  return res.status(200).json({
    success: true,
    count,
  });
};

const markAsRead = async (
  req,
  res
) => {
  const notification =
    await notificationService.markAsRead(
      req.user._id,
      req.params.id
    );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  return res.status(200).json({
    success: true,
    notification,
  });
};

const markAllAsRead = async (
  req,
  res
) => {
  await notificationService.markAllAsRead(
    req.user._id
  );

  return res.status(200).json({
    success: true,
    message:
      "All notifications marked as read",
  });
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};