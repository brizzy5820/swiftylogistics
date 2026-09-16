import Address from "../models/Address.js";
import AppError from "../utils/AppError.js";

const createAddress = async (userId, data) => {
  return Address.create({
    ...data,
    user: userId,
  });
};

const getUserAddresses = async (userId) => {
  return Address.find({ user: userId }).sort({
    createdAt: -1,
  });
};

const getAddressById = async (userId, addressId) => {
  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  return address;
};

const updateAddress = async (
  userId,
  addressId,
  updates
) => {
  const address = await Address.findOneAndUpdate(
    {
      _id: addressId,
      user: userId,
    },
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  return address;
};

const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOneAndDelete({
    _id: addressId,
    user: userId,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }
};

export default {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
};