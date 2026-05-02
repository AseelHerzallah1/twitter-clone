import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    followers: [{
        // a follower is a user, so we reference the User model
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [], // a user has 0 followers by default
    }],
    following: [{  
        // a user can follow other users, so we reference the User model
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [], // a user follows 0 users by default
    }],
    profileImage: {
        type: String,
        default: "", // default profile image URL
    },
    coverImage: {
        type: String,
        default: "", // default cover image URL
    },
    bio : {
        type: String,
        default: "", // default bio is empty
    },
    link : {
        type: String,
        default: "", // default link is empty
    },
    likedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: [],
    }],
    },
    { timestamps: true }

);

const User = mongoose.model("User", userSchema);

export default User;