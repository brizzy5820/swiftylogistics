import adminService from "../services/admin.services.js";

const getDashboard = async (
  req,
  res
) => {
  const stats =
    await adminService.getDashboardStats();

  return res.status(200).json({
    success: true,
    stats,
  });
};

/* USERS */

const getUsers = async (
  req,
  res
) => {
  const {
    role,
    search,
  } = req.query;

  let isActive;

  if (req.query.isActive !== undefined) {
    isActive =
      req.query.isActive === "true";
  }

  const users =
    await adminService.getUsers({
      role,
      isActive,
      search,
    });

  return res.status(200).json({
    success: true,
    users,
  });
};

const getUser = async (
  req,
  res
) => {
  const user =
    await adminService.getUserById(
      req.params.id
    );

  return res.status(200).json({
    success: true,
    user,
  });
};

const updateUser = async (
  req,
  res
) => {
  const user =
    await adminService.updateUser(
      req.params.id,
      req.body,
      req.user._id
    );

  return res.status(200).json({
    success: true,
    message: "User updated successfully",
    user,
  });
};

const updateUserRole = async (
  req,
  res
) => {
  const user =
    await adminService.updateUserRole(
      req.params.id,
      req.body.role,
      req.user._id
    );

  return res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user,
  });
};

const updateUserStatus = async (
  req,
  res
) => {
  const user =
    await adminService.updateUserStatus(
      req.params.id,
      req.body.isActive,
      req.user._id
    );

  return res.status(200).json({
    success: true,
    message: req.body.isActive
      ? "User activated successfully"
      : "User deactivated successfully",
    user,
  });
};

/* RIDERS */

const getRiders = async (
  req,
  res
) => {
  let available;

  let isActive;

  if (req.query.available !== undefined) {
    available =
      req.query.available === "true";
  }

  if (req.query.isActive !== undefined) {
    isActive =
      req.query.isActive === "true";
  }

  const riders =
    await adminService.getRiders({
      available,
      isActive,
    });

  return res.status(200).json({
    success: true,
    riders,
  });
};

const getRider = async (
  req,
  res
) => {
  const rider =
    await adminService.getRiderById(
      req.params.id
    );

  return res.status(200).json({
    success: true,
    rider,
  });
};

const getAvailableRiders = async (
  req,
  res
) => {
  const riders =
    await adminService.findAvailableRiders();

  return res.status(200).json({
    success: true,
    riders,
  });
};

/* ORDERS */

const getOrders = async (
  req,
  res
) => {
  const {
    type,
    status,
    riderId,
  } = req.query;

  const orders =
    await adminService.getAllOrders({
      type,
      status,
      riderId,
    });

  return res.status(200).json({
    success: true,
    orders,
  });
};

const getOrder = async (
  req,
  res
) => {
  const order =
    await adminService.getOrderById(
      req.params.id
    );

  return res.status(200).json({
    success: true,
    order,
  });
};

const getRecentOrders = async (
  req,
  res
) => {
  const orders =
    await adminService.getRecentOrders(
      req.query.limit || 10
    );

  return res.status(200).json({
    success: true,
    orders,
  });
};

/* DISPATCH */

const assignRider = async (
  req,
  res
) => {
  const order =
    await adminService.assignRider(
      req.params.orderId,
      req.body.riderId
    );

  return res.status(200).json({
    success: true,
    message: "Rider assigned successfully",
    order,
  });
};

const autoAssignRider = async (
  req,
  res
) => {
  const order =
    await adminService.autoAssignRider(
      req.params.orderId
    );

  return res.status(200).json({
    success: true,
    message:
      "Available rider assigned successfully",
    order,
  });
};

const updateOrderStatus = async (
  req,
  res
) => {
  const order =
    await adminService.updateOrderStatus(
      req.params.orderId,
      req.body.status
    );

  return res.status(200).json({
    success: true,
    message:
      "Order status updated successfully",
    order,
  });
};

const cancelOrder = async (
  req,
  res
) => {
  const order =
    await adminService.cancelOrder(
      req.params.orderId
    );

  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
};

const createUser = async (req, res) => {
  const user = await adminService.createUser(req.body);
  return res.status(201).json({ success: true, message: "User created successfully", user });
};

const deleteUser = async (req, res) => {
  await adminService.deleteUser(req.params.id, req.user._id);
  return res.status(200).json({ success: true, message: "User deleted successfully" });
};

const setUserPassword = async (req, res) => {
  await adminService.setUserPassword(req.params.id, req.body.password);
  return res.status(200).json({ success: true, message: "Password updated successfully" });
};

const deleteOrder = async (req, res) => {
  await adminService.deleteOrder(req.params.orderId);
  return res.status(200).json({ success: true, message: "Order deleted successfully" });
};

const resetOrder = async (req, res) => {
  const order = await adminService.resetOrder(req.params.orderId);
  return res.status(200).json({ success: true, message: "Order reset to pending", order });
};

export default {
  getDashboard,

  getUsers,
  getUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  createUser,
  deleteUser,
  setUserPassword,

  getRiders,
  getRider,
  getAvailableRiders,

  getOrders,
  getOrder,
  getRecentOrders,

  assignRider,
  autoAssignRider,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  resetOrder,
};