const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal'); // For displaying QR code in terminal
const axios = require('axios');

// Create a new client
const client = new Client();
const GEMINI_API_KEY = 'AIzaSyBVL0NwcJ9YSw1TqYzFTqS_TzV8uWamioA'; // Replace with your Gemini API Key
const API_URL = 'https://gemini-openai-proxy.zuisong.workers.dev/';

// Display QR code in the terminal for login
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with WhatsApp to log in.');
});

// Client is ready after successful login
client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

// Handle incoming messages
client.on('message', async (message) => {
    try {
        // Check if the message starts with "lumina"
        if (message.body.toLowerCase().startsWith('lumina')) {
            const question = message.body.slice(7).trim(); // Extract the question after "lumina"

            if (message.hasMedia) {
                // Download the media
                const media = await message.downloadMedia();
                if (media.mimetype.startsWith('image')) {
                    // Prepare the API payload for image processing
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

                    // Send image to the API
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
                // Process text question
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

// Initialize the client
client.initialize();
