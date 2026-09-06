import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

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

app.use(errorMiddleware);

export default app;