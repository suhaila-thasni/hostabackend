const { loadImage } = require('canvas');
const axios = require('axios');

async function testLoad() {
  const capImgStr = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Circle-icons-profile.svg/512px-Circle-icons-profile.svg.png";
  console.log("Loading capImgStr...");
  try {
    const response = await axios.get(capImgStr, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      validateStatus: (status) => status === 200,
    });
    console.log("Downloaded, byteLength:", response.data.byteLength);
    const img = await loadImage(Buffer.from(response.data));
    console.log("Loaded capImgStr successfully:", img.width, "x", img.height);
  } catch(e) {
    console.error("Failed to load capImgStr:", e.message);
  }
}

testLoad();
