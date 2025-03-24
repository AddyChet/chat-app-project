import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, password, email } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password msut be at least 6 characters!" });
    const userExist = await User.find({ email });
    if (!userExist)
      return res.status(400).json({ message: "Email already exists!" });
    //hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      fullName,
      password: hashedPassword,
    });

    if (newUser) {
      //create jwt token
      generateToken(newUser._id, res);
      await newUser.save();
      return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      return res.status(400).json({ message: "Invalid User Data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const {email, password} = req.body
  try {
   const findUser = await User.findOne({email})
   if(!findUser) return res.status(400).json({message : "Invalid Credentials"})

    //check the password
    const checkPassword = await bcrypt.compare(password, findUser.password)
    if(!checkPassword) return res.status(400).json({message : "Invalid Credentials"})

    //if passowrd is correct generate token
    generateToken(findUser._id, res)

    return res.status(200).json({
      _id: findUser._id,
      fullName: findUser.fullName,
      email: findUser.email,
      profilePic: findUser.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {maxAge : 0} )
    return res.status(200).json({message : "Logged out successfully"})
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req,res) => {
  try {
    const {profilePic} = req.body
    const userId = req.user._id

    if(!profilePic) return res.status(401).json({message : "Profile pic not uploaded"})

    const uploadResponse = await cloudinary.uploader.upload(profilePic)
    const updatedUser = await User.findByIdAndUpdate(userId, {profilePic : uploadResponse.secure_url}, {new : true})

    res.status(200).json(updatedUser)
  } catch (error) {
    console.log("Error updating profile", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const checkAuth = (req,res) => {
  try {
    return res.status(200).json(req.user)
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}