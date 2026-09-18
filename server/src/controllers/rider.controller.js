import riderService from "../services/rider.services.js";

const getProfile = async (req, res) => res.status(200).json({ success: true, rider: await riderService.getRiderProfile(req.user._id) });
const updateProfile = async (req, res) => res.status(200).json({ success: true, message: "Rider profile updated successfully", rider: await riderService.updateRiderProfile(req.user._id, req.body) });
const getJobs = async (req, res) => res.status(200).json({ success: true, jobs: await riderService.getRiderJobs(req.user._id) });
const getJob = async (req, res) => res.status(200).json({ success: true, job: await riderService.getRiderJob(req.user._id, req.params.id) });
const acceptJob = async (req, res) => res.status(200).json({ success: true, message: "Job accepted successfully", job: await riderService.acceptDelivery(req.user._id, req.params.id) });
const updateDeliveryStatus = async (req, res) => res.status(200).json({ success: true, message: "Delivery status updated successfully", delivery: await riderService.updateDeliveryStatus(req.user._id, req.params.deliveryId, req.body.status) });

export default { getProfile, updateProfile, getJobs, getJob, acceptJob, updateDeliveryStatus };
