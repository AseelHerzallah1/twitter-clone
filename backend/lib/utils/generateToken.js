import jwt from "jsonwebtoken";
import { getAuthCookieOptions } from "./cookieOptions.js";

export const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });

    res.cookie("jwt", token, getAuthCookieOptions(15 * 24 * 60 * 60 * 1000));
};
