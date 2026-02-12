# SafeTube Kids - Parent Controlled YouTube Viewer

## 🎈 What is this?
A safe, ad-free (with Premium used), distraction-free YouTube viewer for your child. It only shows videos from channels YOU approve.

## ✨ Features
- **Whitelist Only**: Kids can only watch videos from channels you add.
- **No Rabbit Holes**: No "Recommended Videos" sidebar to lead them astray.
- **Ad-Free Experience**: Utilizes your existing YouTube Premium subscription.
- **Parent Gate**: Simple math question protects the settings menu.
- **Vibrant UI**: Designed to be fun and engaging for kids.

## 🚀 How to Use

1. **Start the App**:
   - Run `npm run dev` in the terminal.
   - Open `http://localhost:5173`.

2. **First Time Setup**:
   - Click the **Settings Gear** (⚙️) in the top right.
   - Answer the math question (e.g., 3 + 2 = ?).
   - **Enter your YouTube API Key**. (See below on how to get one).
   - **Add Channels**: Enter a Channel ID to whitelist it.

3. **How to Get a Channel ID**:
   - Go to a YouTube channel page (e.g., https://www.youtube.com/@SuperSimpleSongs).
   - View the Page Source or look at the URL.
   - Share button -> Copy Link usually gives the handle.
   - *Tip*: You can use a tool like "YouTube Channel ID Finder" online if the URL handles are confusing.

## 🔑 Getting a YouTube API Key (Free)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "KidsSafeTube").
3. Search for "YouTube Data API v3" and **Enable** it.
4. Go to **Credentials** -> **Create Credentials** -> **API Key**.
5. Copy the key and paste it into the app settings.

## 🛡️ Note on Privacy
- Your API Key is stored **locally** in your browser. It is never sent to any other server.
- The app runs entirely on your machine.

Enjoy peace of mind! 🧸
