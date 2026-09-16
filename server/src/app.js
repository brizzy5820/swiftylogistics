import express from "express";
import cors from "cors";
import errorMiddleware from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import addressRoutes from "./routes/address.route.js";
import deliveryRoutes from "./routes/delivery.route.js";
import userRoutes from "./routes/user.routes.js";
import riderRoutes from "./routes/rider.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import rideRoutes from "./routes/ride.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Swifty API is running",
  });
});
app.get("/api/auth", (req,res)=>{
  res.json({
    success: true,
    message:"Users will show here"
  })
})
app.use("/api/auth", authRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/users",userRoutes)
app.use("/api/addresses", addressRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorMiddleware);

export default app;