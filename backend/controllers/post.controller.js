import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";

export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!text && !img) {
            return res.status(400).json({ message: "Post cannot be empty" });
        }

        if (img) {
            const uploadResult = await cloudinary.uploader.upload(img);
            img = uploadResult.secure_url;
        }

        const newPost = new Post({
            user: userId,
            text,
            img,
        });

        await newPost.save();

        res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        console.log("Error in createPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this post" });
        }
        if(post.img) {
            const imgId = post.img.split("/").slice(-1)[0].split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post deleted successfully" });

    } catch (error) {
        console.log("Error in deletePost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id.toString();

        if (!text) {
            return res.status(400).json({ message: "Comment cannot be empty" });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = {
            user: userId,
            text,
        };

        post.comments.push(comment);
        await post.save();

        const updatedPost = await Post.findById(postId).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(updatedPost.comments);
    } catch (error) {
        console.log("Error in commentOnPost controller:", error);
        res.status(500).json({ message: "Internal server error" }); 
    }
}


export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const userLikedPost = post.likes.some(id => id.toString() === userId.toString());

        if (userLikedPost) {
            // Unlike the post
            await post.updateOne({ $pull: { likes: userId } });
            await User.updateOne({_id: post.user}, { $pull: { likedPosts: postId } });
            await Notification.deleteOne({ from: userId, to: post.user, type: "like" });

            const updatedLikes = post.likes.filter(id => id.toString() !== userId.toString());

            return res.status(200).json(updatedLikes);
        } else {
            // Like the post
            post.likes.push(userId);
            await User.updateOne({_id: post.user}, { $push: { likedPosts: postId } });
            await post.save();

            if (userId.toString() !== post.user.toString()) {
                const notification = new Notification({
                    from: userId,
                    to: post.user,
                    type: "like"
                });
                await notification.save();
            }
            const updatedLikes = post.likes.map(id => id.toString());
            return res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        if(posts.length === 0) {
            return res.status(200).json({ message: "No posts found", posts: [] });
        }

        res.status(200).json({ posts });
    } catch (error) {
        console.log("Error in getAllPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if(!user) return res.status(404).json({ message: "User not found" });

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } }).populate({
            path: "user",
            select: "-password"
        }).populate({
            path : "comments.user",
            select: "-password"
        });

        res.status(200).json({ likedPosts });

    } catch (error) {
        console.log("Error in getLikedPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if(!user) return res.status(404).json({ message: "User not found" });
        
        const following = user.following;

        const followingPosts = await Post.find({
            $or: [
                { user: { $in: following } },
                { "retweets.user": { $in: following } }
            ]
        }).populate({
            path: "user",
            select: "-password"
        }).populate({
            path : "comments.user",
            select: "-password"
        }).lean();

        followingPosts.sort((a, b) => {
            const aRetweet = a.retweets?.find(r => following.some(f => f.toString() === r.user.toString()));
            const bRetweet = b.retweets?.find(r => following.some(f => f.toString() === r.user.toString()));
            const aTime = aRetweet?.createdAt || a.createdAt;
            const bTime = bRetweet?.createdAt || b.createdAt;
            return new Date(bTime) - new Date(aTime);
        });

        res.status(200).json({ followingPosts });
    } catch (error) {
        console.log("Error in getFollowingPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserPosts = async (req, res) => {
    const username = req.params.username;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userPosts = await Post.find({
            $or: [{ user: user._id }, { "retweets.user": user._id }]
        }).populate({ path: "user", select: "-password" })
          .populate({ path: "comments.user", select: "-password" })
          .lean();

        // sort: if retweeted by this user, use retweet time; else use post creation time
        userPosts.sort((a, b) => {
            const aTime = a.retweets?.find(r => r.user.toString() === user._id.toString())?.createdAt || a.createdAt;
            const bTime = b.retweets?.find(r => r.user.toString() === user._id.toString())?.createdAt || b.createdAt;
            return new Date(bTime) - new Date(aTime);
        });

        res.status(200).json({ userPosts });
    } catch (error) {
        console.log("Error in getUserPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const retweetPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const hasRetweeted = post.retweets.some(r => {
            const retweetUserId = r.user ? r.user.toString() : r.toString();
            return retweetUserId === userId.toString();
        });

        if (hasRetweeted) {
            await post.updateOne({ $pull: { retweets: { user: userId } } });
            await Post.updateOne({ _id: postId }, { $pull: { retweets: userId } });
            await Notification.deleteOne({ from: userId, to: post.user, type: "retweet" });
            const updatedPost = await Post.findById(postId);
            return res.status(200).json(updatedPost.retweets);
        } else {
            post.retweets.push({ user: userId, createdAt: new Date() });
            await post.save();

            if (userId.toString() !== post.user.toString()) {
                const notification = new Notification({
                    from: userId,
                    to: post.user,
                    type: "retweet"
                });
                await notification.save();
            }

            return res.status(200).json(post.retweets);
        }
    } catch (error) {
        console.log("Error in retweetPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}