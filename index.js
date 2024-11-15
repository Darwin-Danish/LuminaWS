const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const axios = require('axios');

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
        // Check if the message starts with "lumina"
        if (message.body.toLowerCase().startsWith('lumina')) {
            const question = message.body.slice(7).trim();

            if (message.hasMedia) {
                // Download the media
                const media = await message.downloadMedia();
                if (media.mimetype.startsWith('image')) {
                    const payload = {
                        model: "gpt-4-vision-preview",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "What do you see in this picture?" },
                                    { type: "image_url", image_url: { url: media.data } },
                                ],
                            },
                        ],
                        stream: false,
                    };

                    const response = await axios.post(API_URL, payload, {
                        headers: {
                            Authorization: `Bearer ${GEMINI_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    const aiResponse = response.data.choices[0]?.message?.content;
                    message.reply(aiResponse || 'Unable to process the image.');
                } else {
                    message.reply('Please send an image for analysis.');
                }
            } else {
                const payload = {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: question }],
                    temperature: 0.7,
                };

                const response = await axios.post(API_URL, payload, {
                    headers: {
                        Authorization: `Bearer ${GEMINI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                });

                const aiResponse = response.data.choices[0]?.message?.content;
                message.reply(aiResponse || 'Unable to process your question.');
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
