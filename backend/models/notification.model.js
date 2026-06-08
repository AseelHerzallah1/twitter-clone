import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,        
},
to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
},
type: {
    type: String,
    required: true,
    enum: ['follow', 'like', 'comment', 'retweet', 'quote']
},
read: {
    type: Boolean,
    default: false 
},
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;