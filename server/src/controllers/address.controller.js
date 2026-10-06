import addressService from "../services/address.service.js";
import geoService from "../services/geo.service.js";

const parseCoord = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// Reverse geocodes a point. Public on purpose: the address field is used by
// signed-out visitors on the marketing site, and this only ever proxies a
// coordinate to an address — no user data is involved.
const geoReverse = async (req, res) => {
  const lat = parseCoord(req.query.lat);
  const lng = parseCoord(req.query.lng);

  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      message: "A valid lat and lng is required",
    });
  }

  const details = await geoService.reverseGeocode(lat, lng);

  return res.status(200).json({
    success: true,
    details,
  });
};

// Named streets and house-numbered buildings near a point. Same reasoning as
// above — see geo.service.js for why this cannot run from the browser.
const geoNearby = async (req, res) => {
  const lat = parseCoord(req.query.lat);
  const lng = parseCoord(req.query.lng);
  const radiusMeters = Math.min(
    Math.max(parseCoord(req.query.radius) || 700, 50),
    5000
  );

  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      message: "A valid lat and lng is required",
    });
  }

  const places = await geoService.nearbyPlaces({
    lat,
    lng,
    radiusMeters,
    query: typeof req.query.q === "string" ? req.query.q : "",
  });

  return res.status(200).json({
    success: true,
    places,
  });
};

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
  geoReverse,
  geoNearby,
};