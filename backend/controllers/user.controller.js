import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary"; 

export const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select("-password -email -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const tweetsCount = await Post.countDocuments({ user: user._id });
        return res.status(200).json({ user: { ...user.toObject(), tweetsCount } });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
        }
        if (!userToModify || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.some(f => f.toString() === id);

        if (isFollowing) {
            await User.findByIdAndUpdate(id, { $pull: { followers: currentUser._id } });
            await User.findByIdAndUpdate(currentUser._id, { $pull: { following: id } });
            await Notification.deleteOne({ from: currentUser._id, to: id, type: "follow" });

            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            await User.findByIdAndUpdate(id, { $push: { followers: currentUser._id } });
            await User.findByIdAndUpdate(currentUser._id, { $push: { following: id } });

            const newNotification = new Notification({
                from: currentUser._id,
                to: userToModify._id,
                type: "follow"
            });
            await newNotification.save();

            res.status(200).json({ message: "User followed successfully" });
        }
    } catch (error) {
        console.error("Error following/unfollowing user:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        const followingIds = await User.findById(req.user._id).select("following").then(user => user.following);

        const users = await User.aggregate([
            { $match: { _id: { $ne: currentUser._id, $nin: followingIds } } },
            { $sample: { size: 10 } },
            //{ $project: { password: 0, email: 0, __v: 0 } }
        ]);

        const suggestedUsers = users.slice(0, 4);
        suggestedUsers.forEach(user => (user.password = null));

        return res.status(200).json({suggestedUsers});

    } catch (error) {
        console.error("Error fetching suggested users:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const destroyCloudinaryImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes("cloudinary")) return;
    try {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.warn("Could not delete old Cloudinary image:", error.message);
    }
};

export const updateUser = async (req, res) => {
    const {
        fullName,
        email,
        username,
        currentPassword,
        newPassword,
        bio,
        link,
        profileImage,
        coverImage,
    } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if ((!newPassword && currentPassword) || (newPassword && !currentPassword)) {
            return res.status(400).json({ message: "Both current and new passwords are required to update the password" });
        }

        if (newPassword && currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters long" });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (profileImage) {
            await destroyCloudinaryImage(user.profileImage);
            const uploadedResponse = await cloudinary.uploader.upload(profileImage);
            user.profileImage = uploadedResponse.secure_url;
        }

        if (coverImage) {
            await destroyCloudinaryImage(user.coverImage);
            const uploadedResponse = await cloudinary.uploader.upload(coverImage);
            user.coverImage = uploadedResponse.secure_url;
        }

        if (fullName !== undefined) user.fullName = fullName;
        if (email !== undefined) user.email = email;
        if (username !== undefined) user.username = username;
        if (bio !== undefined) user.bio = bio;
        if (link !== undefined) user.link = link;

        await user.save();

        const updatedUser = await User.findById(userId).select("-password");
        return res.status(200).json({ user: updatedUser, message: "User updated successfully" });

    } catch (error) {
        console.error("Error updating user:", error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "field";
            return res.status(400).json({ message: `That ${field} is already in use` });
        }
        return res.status(500).json({ message: "Server error" });
    }
};
export const getFollowers = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .populate({ path: "followers", select: "-password -email" });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ users: user.followers });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getFollowing = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .populate({ path: "following", select: "-password -email" });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ users: user.following });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
