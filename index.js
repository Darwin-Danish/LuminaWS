const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const axios = require('axios');
const ytdl = require('ytdl-core'); // To download YouTube audio
const fs = require('fs');
const ytsr = require('ytsr'); // YouTube Search API

// Replace with your MongoDB connection string
const MONGO_URI = "mongodb+srv://admin:admin@luminamovie.eu8qp.mongodb.net/?retryWrites=true&w=majority&appName=LuminaMovie";
const GEMINI_API_KEY = '';
const API_URL = 'https://gemini-openai-proxy.zuisong.workers.dev/';

// MongoDB schema for storing sessions
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    sessionData: { type: Object, required: true },
});

const Session = mongoose.model('Session', sessionSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// Initialize WhatsApp client with session management
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'whatsapp-bot', // Unique identifier for this client
        dataPath: './auth_data', // Local folder to cache auth files temporarily
    }),
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with WhatsApp to log in.');
});

client.on('authenticated', async (session) => {
    console.log('Authenticated successfully.');
    try {
        // Save session data to MongoDB
        const existingSession = await Session.findOneAndUpdate(
            { sessionId: 'whatsapp-session' },
            { sessionData: session },
            { upsert: true, new: true }
        );
        console.log('Session saved:', existingSession);
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
            const songTitle = message.body.slice(4).trim() + " Music";  // Add "Music" at the end for the search

            // Search for the song on YouTube
            const searchResults = await ytsr(songTitle, { limit: 1 });

            if (searchResults.items.length > 0) {
                const videoUrl = searchResults.items[0].url;

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
                    process.exit(0)
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

// Load session from MongoDB before initializing the client
async function startClient() {
    try {
        const savedSession = await Session.findOne({ sessionId: 'whatsapp-session' });
        if (savedSession) {
            console.log('Restoring session from MongoDB...');
            client.options.authStrategy = new LocalAuth({
                clientId: 'whatsapp-bot',
                dataPath: './auth_data', // Fallback local cache
            });
        }
    } catch (error) {
        console.error('Error loading session from MongoDB:', error);
    }

    client.initialize();
}

startClient();
