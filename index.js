const { Client } = require('whatsapp-web.js');
const { dlAudio } = require('youtube-exec');
const yt = require('youtube-search-without-api-key');
const fs = require('fs');

// Initialize the WhatsApp client
const client = new Client();

// Event listener when the WhatsApp client is ready
client.on('ready', () => {
    console.log('Client is ready!');
});

// Listen to incoming messages
client.on('message', async (message) => {
    if (message.body.startsWith('play')) {
        // Extract the title of the song from the message
        const title = message.body.substring(5).trim() + " music";

        try {
            // Search for the song on YouTube
            const videos = await yt.search(title);
            if (videos.length === 0) {
                message.reply('No results found for the song.');
                return;
            }

            // Get the URL of the first video
            const videoUrl = videos[0].url;

            // Download the audio
            await dlAudio({
                url: videoUrl,
                folder: "downloads",
                filename: title, // Use the song title as the filename
                quality: "best"
            });

            // Send the downloaded audio back to the user
            const audioPath = `downloads/${title}.mp3`;
            if (fs.existsSync(audioPath)) {
                await message.reply(new MessageMedia('audio/mp3', fs.readFileSync(audioPath).toString('base64')));
                fs.unlinkSync(audioPath); // Remove the audio file after sending it
            }

            console.log("Audio downloaded and sent successfully!");
        } catch (err) {
            console.error('An error occurred:', err.message);
            message.reply('An error occurred while processing your request.');
        }
    }
});

// Initialize the WhatsApp Web client
client.initialize();
