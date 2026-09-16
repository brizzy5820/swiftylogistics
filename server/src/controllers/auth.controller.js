import { registerUser, loginUser } from "../services/auth.services.js";
import { verifyAccessToken } from "../utils/jwt.js";
// SIGN UP
const register = async (req, res) => {
  const result = await registerUser(req.body);

  const { accessToken, ...user } = result;

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    accessToken,
    user,
  });
};

// LOGIN
 const login =async (req,res)=>{
  const { accessToken, user } = await loginUser(req.body);

  return  res.status(200).json({
     success:true,
     message: "logged in successfully",
     accessToken,
     user,
   })
};
const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
export  {
  register,
  login, 
  me
};