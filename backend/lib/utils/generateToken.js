import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "15d", // token expires in 15 days
    });

    res.cookie("jwt", token, {
        httpOnly: true, // cookie cannot be accessed by client-side JavaScript
        secure: process.env.NODE_ENV !== "development", // cookie is only sent over HTTPS in development
        sameSite: "strict", // cookie is only sent for same-site requests
        maxAge: 15 * 24 * 60 * 60 * 1000, // cookie expires in 15 days
    });

};
