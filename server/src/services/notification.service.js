import Notification from "../models/Notification.js";

const createNotification = async ({
  userId,
  type,
  title,
  message,
  deliveryId = null,
}) => {
  return Notification.create({
    user: userId,
    type,
    title,
    message,
    delivery: deliveryId,
  });
};

const getUserNotifications = async (
  userId
) => {
  return Notification.find({
    user: userId,
  })
    .populate(
      "delivery",
      "trackingId status type"
    )
    .sort({
      createdAt: -1,
    });
};

const markAsRead = async (
  userId,
  notificationId
) => {
  const notification =
    await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

  return notification;
};

const markAllAsRead = async (
  userId
) => {
  await Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      isRead: true,
    }
  );
};

const getUnreadCount = async (
  userId
) => {
  return Notification.countDocuments({
    user: userId,
    isRead: false,
  });
};

export default {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};