const { Client, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const axios = require('axios');// To download YouTube audio
const fs = require('fs');
const ytSearch = require('yt-search'); // YouTube Search package
const MongoStore = require('wwebjs-mongo'); // MongoDB Store for session storage

// Replace with your MongoDB connection string
const MONGO_URI = "mongodb+srv://admin:admin@luminamovie.eu8qp.mongodb.net/?retryWrites=true&w=majority&appName=LuminaMovie";

// MongoDB schema for storing sessions (if needed for custom management)
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    sessionData: { type: Object, required: true },
});

const Session = mongoose.model('Session', sessionSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// Initialize WhatsApp client with session management using RemoteAuth and MongoStore
const store = new MongoStore({ mongoose: mongoose });

const client = new Client({
    authStrategy: new RemoteAuth({
        store: store, // Store session in MongoDB
        backupSyncIntervalMs: 300000, // Sync every 5 minutes
    }),
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with WhatsApp to log in.');
});

client.on('authenticated', async (session) => {
    console.log('Authenticated successfully.');
    try {
        // Save session data to MongoDB (MongoStore will handle this)
        console.log('Session authenticated and stored!');
    } catch (error) {
        console.error('Error saving session to MongoDB:', error);
    }
});

client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

client.on('message', async (message) => {
    try {
        // Check if the message starts with "play"
        if (message.body.toLowerCase().startsWith('play')) {
            const songTitle = message.body.slice(4).trim();  // Extract the song title

            // Search for the song on YouTube using yt-search
            const result = await ytSearch(songTitle);

            if (result.videos.length > 0) {
                const videoUrl = result.videos[0].url;  // Get the URL of the first search result

                // Download the audio using ytdl (YouTube downloader)
                const stream = ytdl(videoUrl, { filter: 'audioonly' });

                // Save the audio to a file
                const filePath = './music.mp3';
                const file = fs.createWriteStream(filePath);
                stream.pipe(file);

                file.on('finish', async () => {
                    // Send the music file via WhatsApp
                    const media = MessageMedia.fromFilePath(filePath);
                    await message.reply('Here is your music! 🎶', { media });

                    // Optionally, delete the file after sending
                    fs.unlinkSync(filePath);
                });
            } else {
                message.reply('Sorry, I couldn\'t find that music!');
            }
        }
    } catch (error) {
        console.error('Error handling message:', error);
        message.reply('Something went wrong. Please try again later.');
    }
});

// Initialize client
client.initialize();
