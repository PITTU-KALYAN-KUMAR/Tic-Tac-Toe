const sharp = require('sharp');

async function processIcon() {
  try {
    // 1. Trim away any built-in uneven transparent spacing (like drop shadows or offset canvases)
    const trimmed = await sharp('logo.png').trim().toBuffer();

    // 2. Set our fixed container size
    const finalSize = 1024;

    // 3. Define padding: the actual icon will take up 70% of the container
    const paddingFactor = 0.60;
    const targetContentSize = Math.floor(finalSize * paddingFactor);

    // 4. Resize the trimmed image so it fits perfectly inside our target size
    const resizedTrimmed = await sharp(trimmed)
      .resize(targetContentSize, targetContentSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // 5. Create a perfect 1024x1024 transparent canvas and slap the image exactly in the center
    await sharp({
      create: {
        width: finalSize,
        height: finalSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([
        { input: resizedTrimmed, gravity: 'center' }
      ])
      .toFile('logo_padded.png');

    console.log('Successfully created strictly centered logo_padded.png');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processIcon();
