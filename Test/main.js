const { Client, LocalAuth, MessageMedia} = require('whatsapp-web.js');
const axios = require('axios');
const qrcodeTerminal = require('qrcode-terminal');
const request = require('request');
const fs = require('fs');
const path = require('path');
const http = require('http');
const firebase = require('firebase-admin');
const serviceAccount = require('./lumina-ai-7d702-firebase-adminsdk-tltpt-e829535204.json'); // Update with the path to your service account key file
const Scraper = require('youtube-search-scraper').default;
const DownloadAudio = require("node-youtube-audio")
const fsPromises = fs.promises;
const ffmpeg = require('fluent-ffmpeg');
const { config, createAudioFromText } = require('tiktok-tts')
const gtts = require('gtts');
var langdetect = require('langdetect');

//-----------BetaVersion------------

//---------------------------------


config('13971c4e1c3da404e16d480728e71cf0');

async function tts(text, msg){
    await createAudioFromText(text, './audio/myAudio', 'en_us_009');
    console.log("Audio file generated!");
    fetchAndSendAudio(msg);
    
}


const youtube = new Scraper();

// Replace with your actual API key (refer to Google Cloud Project setup)
const apiKey = 'AIzaSyBVL0NwcJ9YSw1TqYzFTqS_TzV8uWamioA';
const luminaUrl = 'https://gemini-openai-proxy.zuisong.workers.dev/'; // Replace if your URL differs
const userSessions = {};
voiceCommandState = { enabled: false, timer: null }; 

const client = new Client({
    authStrategy: new LocalAuth({ 
    clientId: "stable-version",
    dataPath: './Stable',
    //executablePath: '/usr/bin/chromium'
    })
});
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Stable Version Is Online');
});

const expandUrl = async (shortUrl) => {
    try {
        const response = await axios.head(shortUrl, { maxRedirects: 5 });
        return response.request.res.responseUrl;
    } catch (error) {
        console.error(`Error expanding URL: ${error.message}`);
        return null;
    }
};

// Function to extract the video ID from the TikTok URL
const getVideoIdFromUrl = (url) => {
    const match = url.match(/\b\d{19}\b/);
    return match ? match[0] : null;
};

// Function to fetch TikTok data using the API and extract the video URL


// Initialize Firebase Admin SDK
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://lumina-ai-7d702-default-rtdb.firebaseio.com/'
  });
  
  const db = firebase.database();
  
  const fetchTikTokData = async (expandedUrl, senderId, msg) => {
      console.log(expandedUrl);
      try {
          const options = {
              method: 'GET',
              url: `https://social-media-video-downloader.p.rapidapi.com/smvd/get/tiktok?url=${encodeURIComponent(expandedUrl)}`,
              headers: {
                  'x-rapidapi-key': 'd85293b319msh654dd2ab251cf63p13fbdejsndf8c2737fa16',
                  'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com',
              }
          };
  
          console.log("Requesting....");
          await msg.reply('Downloading Video To Lumina Server...');
          const response = await axios.request(options);
          console.log("Response:", response.data);
  
          // Check if the response contains the video download URL
          if (response.data && response.data.links && response.data.links.length > 0 && response.data.links[0].link) {
              const videoDownloadUrl = response.data.links[0].link;
              console.log(videoDownloadUrl);
  
              // Generate a random alphanumeric ID
              const randomId = generateRandomId();
              console.log("Random ID:", randomId);
  
              // Save the videoDownloadUrl to Firebase with the random ID
              await db.ref(`videos/${randomId}`).set({
                  videoUrl: videoDownloadUrl
              });
              console.log("Video URL saved to Firebase.");
  
              // Construct website URL with the random ID
              const websiteUrl = `https://lumina-downloader.netlify.app?id=${randomId}`;
              console.log("Website URL:", websiteUrl);
  
              // Generate dynamic URL with a random number
              const dynamicUrl = `https://link-to.net/1185051/${Math.floor(Math.random() * 10000)}/dynamic?r=${websiteUrl}`;
              console.log("Dynamic URL:", dynamicUrl);
  
              // Shorten the dynamic URL
              const shortenedUrl = await shortenUrl(websiteUrl);
              console.log("Shortened URL:", shortenedUrl);
  
              // Send the shortened URL as a message to the user
              await msg.reply(`*✅ BERJAYA*\n\n_Status:_\n> Video Berjaya Dimuat Turun Ke Server Lumina \n\nSila layari laman web dibawah untuk memuat turun. \n\n 🔗: ${shortenedUrl}`);
          } else {
              console.error("Video download URL not found in the response or response structure doesn't match expected path.");
          }
      } catch (error) {
          console.error(`Error fetching video data: ${error.message}`);
      }
  };
  
  // Function to generate a random alphanumeric ID
  const generateRandomId = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
  };
  
  // Function to shorten a URL
  const shortenUrl = async (url) => {
      const shortUrlOptions = {
          method: 'POST',
          url: 'https://shrtlnk.dev/api/v2/link',
          headers: {
              'api-key': 'BRPOHr0Xw13HPEVj1MaxUpMyWSVKZovymc9r74IJL2x0I',
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          data: {
              url: url
          }
      };
  
      const shortUrlResponse = await axios.request(shortUrlOptions);
      return shortUrlResponse.data.shrtlnk;
  };
  


const postToWebsite = async (expandedUrl, videoUrl) => {
    const websiteUrl = `https://self-service-medium.000webhostapp.com/display.html?expanded_url=${encodeURIComponent(expandedUrl)}&video_url=${encodeURIComponent(videoUrl)}`;
    console.log(websiteUrl);
    client.sendMessage(websiteUrl);
};


  
  client.on('message', async (msg) => {
    console.log('Received message:', msg);
    const userId = msg.from; // Assuming msg.from contains the user's unique identifier
    
    // Initialize user session if it doesn't exist
    if (!userSessions[userId]) {
        userSessions[userId] = { voiceCommandState: { enabled: false, timer: null } };
    }
  
    if (msg.body == "!voice on") {
      voiceCommandState.enabled = true;
      msg.reply('Voice command enabled for 30 minutes.');
  
      // Clear existing timer if any
      if (voiceCommandState.timer) {
        clearTimeout(voiceCommandState.timer);
      }
  
      // Set a timer to disable after 30 minutes
      voiceCommandState.timer = setTimeout(() => {
        voiceCommandState.enabled = false;
        msg.reply('Voice command disabled after 30 minutes.');
      }, 30 * 60 * 1000); // 30 minutes in milliseconds
  
      return; // Exit after processing the command
    }
  
    // Check similarity for disabling voice command
  
    if (msg.body == "!voice off") {
      voiceCommandState.enabled = false;
      if (voiceCommandState.timer) {
        clearTimeout(voiceCommandState.timer);
        voiceCommandState.timer = null;
      }
      msg.reply('Voice command disabled.');
      return; // Exit after processing the command
    }

    if (msg.body.toLowerCase().startsWith('y ')) {
        const songName = msg.body.slice(2) + ' lyric'; // Extract the song name
        console.log(songName);
    
        let currentPage = 1; // Track the current page number
        let videos; // Array to hold current page's videos
        let results; // Store the search results
        const requester = msg.author || msg.from; // Track the user who initiated the command
        let musicDownloaded = false; // Flag to track if music has been downloaded
    
        try {
            // Function to prepare and send response message
            const sendResponse = async () => {
                // Extract videos for the current page
                videos = results.videos.slice((currentPage - 1) * 10, currentPage * 10);
    
                let responseMessage = `🔎 Search Results From Lumina Database - Page ${currentPage}\n\n`;
    
                // Prepare the response message with numbered list of titles
                videos.forEach((video, index) => {
                    responseMessage += `${index + 1}. ${video.title}\n`;
                });
    
                // Add navigation instructions based on current page
                if (currentPage < Math.ceil(results.videos.length / 10)) {
                    responseMessage += "\nTekan *️⃣ untuk halaman seterusnya.\n";
                }
                if (currentPage > 1) {
                    responseMessage += "\nTekan #️⃣ untuk kembali ke halaman pertama.\n";
                }
                responseMessage += "\n> Sila pilih dengan menghantar diantara nombor diatas:\n\n~ Coding By Darwin ✧(｡•̀ᴗ-)✧";
    
                await msg.reply(responseMessage);
            };
    
            // Search for the song on YouTube
            results = await youtube.search(songName);
            console.log(results);
    
            // Initialize and send the first page of results
            await sendResponse();
    
            // Listen for user response to select a song or navigate pages
            client.on('message', async (message) => {
                // Only process messages from the original requester for this session
                const messageSender = message.author || message.from;
                if (messageSender !== requester || musicDownloaded) {
                    return;
                }
    
                const selection = parseInt(message.body.trim());
    
                if (!isNaN(selection) && selection >= 1 && selection <= videos.length) {
                    await msg.reply('🔄 Sila Tunggu Sebentar\n\n> Proses Ini Mungkin Mengambil Masa hingga 1-3minit\n\n\nTerima Kasih Kerana Menggunakan Lumina Ai\n- Darwin');
                    // User selected a song, proceed with downloading
                    const selectedVideo = videos[selection - 1];
                    const videoLink = selectedVideo.link;
    
                    // Download the audio using DownloadAudio
                    new DownloadAudio(videoLink)
                        .codec("libmp3lame")
                        .outputDirectory("./music")
                        .fileExtension("mp3")
                        .execute()
                        .then((filePath) => {
                            console.log('Result: ' + filePath);
                            const media = MessageMedia.fromFilePath(filePath);
                            msg.reply(media);
                            musicDownloaded = true; // Set flag to true after downloading music
                        })
                        .catch(console.error);
    
                    // Clean up: Delete all files in the music directory
                    await deleteAllFilesInDirectory(path.join(__dirname, 'music'));
    
                } else if (message.body.trim() === '*') {
                    // User wants to go to the next page
                    if (currentPage < Math.ceil(results.videos.length / 10)) {
                        currentPage++;
                        await sendResponse();
                    } else {
                        await msg.reply('Anda sudah berada di halaman terakhir.');
                    }
    
                } else if (message.body.trim() === '#') {
                    // User wants to return to the first page
                    currentPage = 1;
                    await sendResponse();
    
                } else {
                    musicDownloaded = true;
                    await msg.reply('ℹ️ Pilihan tidak sah. Sila pilih nombor yang betul atau gunakan * atau # untuk navigasi halaman.');
                }
            });
    
        } catch (error) {
            musicDownloaded = true;
            console.error('Error:', error);
            await msg.reply('ℹ️ Terdapat ralat semasa mencari lagu di Database.');
        }
    }
    // Check if the message has media and a caption
    if (msg.hasMedia && msg._data.caption) {
      console.log('Message has media and caption:', msg._data.caption);
      const captionLower = msg._data.caption.toLowerCase();
      const keyword = captionLower.includes('lumina') ? '!lumina' : captionLower.includes('!lumina') ? 'lumina' : null;
  
      if (keyword) {
        console.log(`Caption contains "${keyword}".`);
        const prompt = msg._data.caption.slice(keyword.length).trim();
        console.log('Extracted prompt:', prompt);
        await msg.reply('Please Wait, Connecting To Main Server...');
  
        try {
          const media = await msg.downloadMedia();
          console.log('Media downloaded:', media);
          if (media && media.mimetype && media.mimetype.startsWith('image/')) {
            const extension = media.mimetype.split('/')[1]; // Get the file extension
            const fileName = `img/${msg.timestamp}.${extension}`;
            const filePath = path.resolve(__dirname, fileName);
            const buffer = Buffer.from(media.data, 'base64'); // Convert base64 string to buffer
  
            fs.writeFile(filePath, buffer, async (err) => {
              if (err) {
                console.error('Error saving media:', err);
              } else {
                console.log('Image saved successfully:', filePath);
  
                // Prepare the API request
                const payload = {
                  model: 'gpt-4-vision-preview',
                  messages: [
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'text',
                          text: prompt,
                        },
                        {
                          type: 'image_url',
                          image_url: {
                            url: `data:${media.mimetype};base64,${media.data}`,
                          },
                        },
                      ],
                    },
                  ],
                  stream: false,
                };
  
                try {
                  const response = await axios.post(luminaUrl, payload, {
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                      'Content-Type': 'application/json'
                    },
                  });
  
                  // Extract the response message from the API response
                  const apiResponse = response.data.choices[0].message.content;
                  console.log('API response:', apiResponse);
  
                  // Check if voice command is enabled
                  if (voiceCommandState.enabled) {
                    await tts(apiResponse, msg);
                  } else {
                    await msg.reply(apiResponse);
                    await deleteAllFilesInDirectory(path.join(__dirname, 'img'));
                  }
                } catch (apiError) {
                  await longTtts(luminaResponse, msg);
                  console.error('Error calling API:', apiError);
                }
              }
            });
          } else {
            console.log('Received media is not an image.');
          }
        } catch (error) {
          console.error('Error downloading media:', error);
        }
        return;
      } else {
        console.log('Caption does not contain the required text.');
      }
    }
  
    // Check for TikTok URL
    if (msg.body.startsWith('https://vt.tiktok.com/')) {
      const shortUrl = msg.body.trim();
      msg.reply("ℹ️ Anda menggunakan versi lumina Ai percuma\n\n_✅ Video sedang dimuat turun, pengguna secara percuma mengalami pengurangan kelajuan muat turun untuk mengurangkan kos server_\n\n> Jangkaan Masa Selesai = 1-5 minit")
      try {
        if (!shortUrl) {
            console.log('Not a valid TikTok URL');
            return;
        }

        // Prepare data for POST request
        const postData = {
            videoUrl: shortUrl,
            msg: {
                from: msg.from
            }
        };

        // Make POST request to external endpoint
        const response = await axios.post('https://4f631c72-b6e5-47fe-af6f-22ac5168dae7-00-3hw6f300uy7ki.pike.replit.dev:3001/video', postData);

        console.log('POST request sent successfully:', response.data);
        msg.reply("Berjaya!, sila tunggu sebentar sementara server kami untuk memuat turun video anda.Maklum bahawa masa menunggu akan lebih lama bergantung pada durasi video.\n\n> Jangkaan Waktu: 1-5 minit")
    } catch (error) {
        console.error('Error processing TikTok URL:', error);
        msg.reply("Error to contact data server, please check system status here\n\n> https://stats.uptimerobot.com/jKjyRHlYwB")
    }
}

  
    // Regular message processing
    console.log('Regular message processing...');
    if (!msg.body.toLowerCase().startsWith('hai lumina') && !msg.body.toLowerCase().startsWith('hi lumina')) {
      return; // Ignore other messages
    }
    let luminaResponse; // Define luminaResponse variable here

    try {
        // Inform user about connecting to database (optional)
        await msg.reply('Connecting...');

        const userQuery = msg.body; // Capture the entire message

        const data = {
            model: 'gpt-4-turbo', // Replace with your desired model if applicable
            messages: [
                {
                    role: 'system',
                    content: 'If user asks what your name is, tell them your name is Lumina, and you are trained by a student named Darwin Danish.',
                },
                {
                    role: 'user',
                    content: userQuery,
                },
            ],
            temperature: 1,
        };

        const response = await postRequestToApi(data);

        // Print the JSON response before phrasing it
        console.log('JSON Response:', JSON.stringify(response, null, 2)); // Pretty-print JSON

        if (response && response.choices && response.choices.length > 0) {
            luminaResponse = response.choices[0].message.content; // Assign value to luminaResponse

            // Check if voice command is enabled
            if (voiceCommandState.enabled) {
                await tts(luminaResponse, msg);
            } else {
                await msg.reply(luminaResponse);
            }
        } else {
            await msg.reply('No response from API.');
        }
    } catch (error) {
        // Use luminaResponse here if needed
        await longTtts(luminaResponse, msg); // Here you can use luminaResponse
        console.error('Error:', error);
    }
});
  
async function handleTextToSpeech(luminaResponse, msg) {
    //const ttsOptionsPost = {
        //method: 'POST',
        //url: 'https://large-text-to-speech.p.rapidapi.com/tts',
        //headers: {
           // 'x-rapidapi-key': 'd85293b319msh654dd2ab251cf63p13fbdejsndf8c2737fa16',
            //'x-rapidapi-host': 'large-text-to-speech.p.rapidapi.com',
            //'Content-Type': 'application/json'
       // },
       // data: { text: luminaResponse }
    //};

    try {
        //const postResponse = await axios.request(ttsOptionsPost);
        //const ttsId = postResponse.data.id;
        //console.log('Text-to-Speech ID:', ttsId);
        
        // Check the status of the TTS process
        //await checkTtsStatus(ttsId, msg);
    } catch (error) {
        console.error('Error with TTS POST request:', error);
        await msg.reply('There was an error with the text-to-speech service.');
    }
}

async function checkTtsStatus(ttsId, msg) {
    const ttsOptionsGet = {
        method: 'GET',
        url: `https://large-text-to-speech.p.rapidapi.com/tts?id=${ttsId}`,
        headers: {
            'x-rapidapi-key': 'd85293b319msh654dd2ab251cf63p13fbdejsndf8c2737fa16',
            'x-rapidapi-host': 'large-text-to-speech.p.rapidapi.com'
        }
    };

    try {
        const getResponse = await axios.request(ttsOptionsGet);
        const status = getResponse.data.status;

        if (status === 'success') {
            const audioUrl = getResponse.data.url;
            const media = await MessageMedia.fromUrl(audioUrl);
            await fetchAndSendAudio(client, msg, audioUrl);
            await msg.reply(media);
        } else if (status === 'processing') {
            console.log('TTS processing, retrying in 5 seconds...');
            setTimeout(() => checkTtsStatus(ttsId, msg), 5000); // Retry after 5 seconds
        } else {
            console.error('TTS failed:', getResponse.data.error);
            await msg.reply('There was an error with the text-to-speech service.');
        }
    } catch (error) {
        console.error('Error with TTS GET request:', error);
        //await msg.reply('There was an error with the text-to-speech service.');
    }
}

function postRequestToApi(data) {
    const url = luminaUrl;

    const options = {
        url: url,
        method: 'POST',
        json: true, // Send data as JSON
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: data,
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}
async function fetchAndSendAudio(msg) {
    try {
        const audioFileName = path.join(__dirname, 'audio', 'myAudio.mp3');
        const convertedAudioFileName = path.join(__dirname, 'audio', 'converted_audio.ogg');
        
        await new Promise((resolve, reject) => {
            ffmpeg(audioFileName)
                .toFormat('ogg')
                .audioCodec('opus')
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .save(convertedAudioFileName);
        });

        const convertedAudioBuffer = fs.readFileSync(convertedAudioFileName);
        const media = MessageMedia.fromFilePath(convertedAudioFileName);

        await msg.reply(media);
    } catch (error) {
        console.error('Error:', error);
        await msg.reply('There was an error processing the audio file.');
    }
}


async function deleteAllFilesInDirectory(directory) {
    try {
        const files = await fsPromises.readdir(directory);
        const deletePromises = files.map(file => fsPromises.unlink(path.join(directory, file)));
        await Promise.all(deletePromises);
        console.log(`All files in ${directory} have been deleted.`);
    } catch (error) {
        console.error(`Error deleting files in ${directory}:`, error);
    }
}


//--------------------------------
async function longTtts(text, msg) {
    try {
        console.log(text);
        const langCode = langdetect.detect(text);
        console.log(langCode);

        // Ensure langCode is an array with at least one element
        if (Array.isArray(langCode) && langCode.length > 0) {
            const detectedLang = langCode[0].lang;
            const detectionProb = langCode[0].prob;

            // Check if detected language is English and probability is greater than 0.7
            if (detectedLang === 'en' && detectionProb > 0.7) {
                const gttsVoice = new gtts(text, 'en');
                gttsVoice.save(path.join(__dirname, 'audio', 'myAudio.mp3'), async function(err, result) {
                    if (err) {
                        console.error('Error saving TTS audio:', err);
                        await msg.reply('There was an error with the text-to-speech service.');
                    } else {
                        console.log('Audio file saved successfully:', result);
                        await fetchAndSendAudio(msg);
                    }
                });
            } else if (detectedLang === 'id' || detectedLang === 'ms') {
                // For Indonesian or Bahasa Malaysia, check probability and create TTS accordingly
                if (detectionProb > 0.7) {
                    const lang = detectedLang === 'id' ? 'id' : 'ms';
                    const gttsVoice = new gtts(text, lang);
                    gttsVoice.save(path.join(__dirname, 'audio', 'myAudio.mp3'), async function(err, result) {
                        if (err) {
                            console.error('Error saving TTS audio:', err);
                            await msg.reply('There was an error with the text-to-speech service.');
                        } else {
                            console.log('Audio file saved successfully:', result);
                            await fetchAndSendAudio(msg);
                        }
                    });
                } else {
                    console.log(`Detected ${detectedLang} but probability (${detectionProb}) is too low.`);
                    await msg.reply('Unsupported language or low detection probability.');
                }
            } else {
                console.log('Unsupported language or low detection probability:', detectedLang, detectionProb);
                await msg.reply('Unsupported language detected or low detection probability.');
            }
        } else {
            console.log('Language detection failed or no language detected.');
            await msg.reply('Language detection failed or no language detected.');
        }
    } catch (error) {
        console.error('Error with TTS request:', error);
        await msg.reply('There was an error with the text-to-speech service.');
    }
}


client.initialize();
