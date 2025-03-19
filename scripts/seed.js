const mongoose = require('mongoose');
const { Post, Comment, User, Community, Notification } = require('./db.js');

mongoose.connect('mongodb://127.0.0.1:27017/weebsiteDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDBs');

    // Sample data for each schema
    const sampleUsers = [
        { profilePicture: 'user1.png', username: 'user1', bio: 'Anime enthusiast', password: 'password123' },
        { profilePicture: 'user2.png', username: 'user2', bio: 'Manga lover', password: 'password456' },
        { profilePicture: 'user3.png', username: 'user3', bio: 'Cosplay artist', password: 'cosplayfan' },
        { profilePicture: 'user4.png', username: 'user4', bio: 'OST collector', password: 'musiclover' },
        { profilePicture: 'user5.png', username: 'user5', bio: 'Isekai Anime Addict', password: 'isekai4life' },
        { profilePicture: 'user6.png', username: 'user6', bio: 'Aspiring Manga Artist', password: 'mangamaster' },
        { profilePicture: 'user7.png', username: 'user7', bio: 'Ghibli Film Fanatic', password: 'spiritedaway' },
        { profilePicture: 'user8.png', username: 'user8', bio: 'Shonen Anime Expert', password: 'shonenpower' }
    ];

    const sampleCommunities = [
        { name: 'Anime Fans', members: 1500, onlineMembers: 200, dateCreated: new Date(), description: 'For anime lovers', communityPfp: 'anime.png', bannerPfp: 'banner1.png' },
        { name: 'Manga Readers', members: 1000, onlineMembers: 150, dateCreated: new Date(), description: 'Discuss your favorite manga', communityPfp: 'manga.png', bannerPfp: 'banner2.png' },
        { name: 'Cosplayers United', members: 800, onlineMembers: 75, dateCreated: new Date(), description: 'Showcase your best cosplay creations!', communityPfp: 'cosplay.png', bannerPfp: 'banner3.png' },
        { name: 'Isekai Fans', members: 600, onlineMembers: 50, dateCreated: new Date(), description: 'For isekai anime enthusiasts', communityPfp: 'isekai.png', bannerPfp: 'banner4.png' }
    ];

    const sampleNotifications = [
        { userID: 1, content: 'You have a new comment!', type: 'comment', read: false },
        { userID: 2, content: 'Your post was upvoted!', type: 'upvote', read: true },
        { userID: 3, content: 'Your cosplay post is trending!', type: 'trending', read: false },
        { userID: 4, content: 'Someone mentioned you in a comment.', type: 'mention', read: false },
        { userID: 5, content: 'Your Isekai post is popular!', type: 'trending', read: false },
        { userID: 6, content: 'Your manga tip post received 40 upvotes!', type: 'upvote', read: true }
    ];

    // Insert sample data
    return Promise.all([
        User.insertMany(sampleUsers),
        Community.insertMany(sampleCommunities),
        Notification.insertMany(sampleNotifications)
    ]);
});