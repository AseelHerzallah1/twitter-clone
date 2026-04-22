import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../modles/user.model.js";

export const signup = async (req, res) => {
    try {
        const {fullName, username, email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email format"
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                error: "Username already in use"
            });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                error: "Email already in use"
            });
        }

        // hash the password
        // 123456 ==> $2a$10$EixZaYVK1fsbw1Zfb - not readable

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const salt = await bcrypt.genSalt(10); // generate a salt
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        })

        if(newUser) {
           generateTokenAndSetCookie(newUser._id, res);
           await newUser.save();
            res.status(201).json({
                message: "User created successfully",
                user: {
                    id: newUser._id,
                    fullName: newUser.fullName,
                    username: newUser.username,
                    email: newUser.email,
                    followers: newUser.followers,
                    following: newUser.following,
                    profileImg: newUser.profileImg,
                    coverImg: newUser.coverImg
                }
            });

        }else {
            res.status(400).json({
                error: "Invalid user data"
            });
        }

    } catch (error) {
            console.error("Error in signup controller:", error);
            res.status(500).json({
            error: "Internal server error"
        });
    }
}

export const login = async (req, res) => {
    try{ 
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !isPasswordValid) {
            return res.status(400).json({
                error: "Invalid username or password"
            });
        }
        
        generateTokenAndSetCookie(user._id, res);
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                followers: user.followers,
                following: user.following,
                profileImg: user.profileImg,
                coverImg: user.coverImg
            }
        });


    }
        catch (error) {
            console.error("Error in login controller:", error);
            res.status(500).json({
            error: "Internal server error"
        });
        }

}

export const logout = async (req, res) => {
    try{
        res.cookie("jwt", "", { maxAge: 0 });// set the cookie to expire immediately
        res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {
        console.error("Error in logout controller:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        res.status(200).json(user);

    } catch (error) {
        console.error("Error in getCurrentUser controller:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
} 
