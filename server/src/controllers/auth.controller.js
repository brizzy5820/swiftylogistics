import {registerUser,loginUser }from "../services/auth.services.js";
// SIGN UP
 const register = async (req, res) => {
  const user = await registerUser(req.body);

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    user,
  });
};

// LOGIN
 const login =async (req,res)=>{
  const user = await loginUser(req.body);

 return  res.status(200).json({
    success:true,
    message: "logged in successfully",
    accessToken: result.accessToken,
    user,
  })
};
export  {
  register,
  login
};