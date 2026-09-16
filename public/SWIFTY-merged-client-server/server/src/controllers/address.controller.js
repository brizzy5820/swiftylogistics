import addressService from "../services/address.service.js";

const createAddress = async (req, res) => {
  const address = await addressService.createAddress(
    req.user._id,
    req.body
  );

  return res.status(201).json({
    success: true,
    message: "Address created successfully",
    address,
  });
};

const getAddresses = async (req, res) => {
  const addresses =
    await addressService.getUserAddresses(req.user._id);

  return res.status(200).json({
    success: true,
    addresses,
  });
};

const getAddress = async (req, res) => {
  const address =
    await addressService.getAddressById(
      req.user._id,
      req.params.id
    );

  return res.status(200).json({
    success: true,
    address,
  });
};

const updateAddress = async (req, res) => {
  const address =
    await addressService.updateAddress(
      req.user._id,
      req.params.id,
      req.body
    );

  return res.status(200).json({
    success: true,
    message: "Address updated successfully",
    address,
  });
};

const deleteAddress = async (req, res) => {
  await addressService.deleteAddress(
    req.user._id,
    req.params.id
  );

  return res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
};

export default {
  createAddress,
  getAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
};