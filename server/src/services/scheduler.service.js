import Delivery from "../models/Delivery.js";

const activateScheduledOrders = async () => {
  const now = new Date();

  const result = await Delivery.updateMany(
    {
      isScheduled: true,
      status: "scheduled",
      scheduledFor: {
        $lte: now,
      },
    },
    {
      $set: {
        status: "pending",
        isScheduled: false,
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(
      `Activated ${result.modifiedCount} scheduled order(s)`
    );
  }
};

const startScheduler = () => {
  activateScheduledOrders();

  setInterval(
    activateScheduledOrders,
    30 * 1000
  );
};

export default startScheduler;