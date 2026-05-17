import User from "../src/models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { apiResponse } from "../utils/apiResponse.js";

// sign up function
export const signup = async (req, res) => {
  try {
    // fetch values from request
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
      return apiResponse(res, 400, false, "Name must be at least 2 characters long");
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      return apiResponse(res, 400, false, "Password must be at least 8 characters long, include an uppercase letter, a digit, and a special character");
    }

    // check user exists or not
    const checkExisting = await User.findOne({ email });
    if (checkExisting) {
      return apiResponse(res, 409, false, "User already exists");
    }

    // hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user document
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    // save the new user in database
    await newUser.save();

    // generate token using jwt
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    return apiResponse(res, 201, true, "User registered successfully", { token });
  } catch (error) {
    // error handling
    console.error("Signup error:", error);
    return apiResponse(res, 500, false, "Server error during signup");
  }
};

// login function
export const login = async (req, res) => {
  try {
    // fetch user data from request
    const { email, password } = req.body;

    // check if email and password exist in request
    if (!email || !password) {
      return apiResponse(res, 400, false, "Email and password are required");
    }

    // check if user exists or not
    const user = await User.findOne({ email });
    if (!user) {
      return apiResponse(res, 409, false, "User does not exist");
    }

    // check password using bcrypt
    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) {
      return apiResponse(res, 401, false, "Password does not match");
    }

    // generate jwt token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    return apiResponse(res, 200, true, "Login successful", { token });
  } catch (error) {
    // error handling
    console.log("Login error: ", error);
    return apiResponse(res, 500, false, "Server error during login");
  }
};

// access user details function
export const getUser = async (req, res) => {
  try {
    // fetch user data from request
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return apiResponse(res, 404, false, "User not found");
    }
    return apiResponse(res, 200, true, "User fetched successfully", user);
  } catch (_error) {
    // error handling
    return apiResponse(res, 500, false, "Error fetching user data");
  }
};
