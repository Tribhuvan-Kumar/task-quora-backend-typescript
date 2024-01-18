import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";

import { User, IUser } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const verifyJWT = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        throw new ApiError(401, "Unauthorized User Request");
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as jwt.JwtPayload;

      const currentUser = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );
      if (!currentUser) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = currentUser;
      next();
    } catch (error) {
      throw new ApiError(
        401,
        (error as any)?.message || "Invalid access Token"
      );
    }
  }
);
