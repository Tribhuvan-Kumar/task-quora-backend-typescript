import { Request, Response } from "express";

import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import { User } from "../models/user.model";

import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

const oneDayInMillis = 1 * 24 * 60 * 60 * 1000;
const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

const generateAccessAndRefreshToken = async (userId: number) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user?.generateAccessToken();
    const refreshToken = user?.generateRefreshToken();

    if (user) {
      user.refreshToken = refreshToken;
      await user?.save({ validateBeforeSave: false });
    }

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens!");
  }
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  if (
    [fullName, email, password].some((field) => {
      field.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email address!");
  }

  const passwordRegex =
    /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!passwordRegex.test(password)) {
    throw new ApiError(
      400,
      "Password must have at least one symbol, one capital letter, one number and must be 8 characters!"
    );
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User already exists!");
  }

  const user = await User.create({
    fullName,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to registering user!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email or password required!");
  }
  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email address!");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exists!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user crediencials!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...options,
      expires: new Date(Date.now() + oneDayInMillis),
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      expires: new Date(Date.now() + sevenDaysInMillis),
    })
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated!");
  }
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request!");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as { _id: string };

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token!");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...options,
        expires: new Date(Date.now() + oneDayInMillis),
      })
      .cookie("refreshToken", refreshToken, {
        ...options,
        expires: new Date(Date.now() + sevenDaysInMillis),
      })
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed!"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      (error as any)?.message || "Invalid refresh token!"
    );
  }
});

const getCurrentUser = asyncHandler(async (req: AuthRequest, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully!"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
};
