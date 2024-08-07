import * as crypto from "crypto";
import Jimp from "jimp";
import fs from "fs/promises";
import path from "path";

// Settings
const pixelSize = 10;
const rugWidth = 13;
const rugHeight = 20;
const canvasWidth = 512;
const canvasHeight = 512;
const rugXMid = Math.floor(canvasWidth / 2);
const rugYMid = Math.floor(canvasHeight / 2);

export function generateRandomHex(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

function lightenColor(
  r: number,
  g: number,
  b: number,
  factor: number = 0.9,
): number {
  // Increase each color component by the factor, capping at 255
  const newR = Math.min(255, r + (255 - r) * factor);
  const newG = Math.min(255, g + (255 - g) * factor);
  const newB = Math.min(255, b + (255 - b) * factor);

  // Convert back to Jimp color format
  return Jimp.rgbaToInt(
    Math.round(newR),
    Math.round(newG),
    Math.round(newB),
    255,
  );
}

async function generatePixelArt(hash: string): Promise<Buffer> {
  const data = new Uint8Array(
    hash.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  const colors = hash.match(/.{6}/g)!.map(hexToRgb);

  const image = new Jimp(canvasWidth, canvasHeight);

  // Fill background - with alpha
  const bgColor = Jimp.rgbaToInt(colors[0][0], colors[0][1], colors[0][2], 255);

  // Apply the lightened version of the background color and fill background
  const lightenedBgColor = lightenColor(
    colors[0][0],
    colors[0][1],
    colors[0][2],
  );
  image.scan(
    0,
    0,
    image.bitmap.width,
    image.bitmap.height,
    function (x, y, idx) {
      this.setPixelColor(lightenedBgColor, x, y);
    },
  );

  for (let x = 0; x < rugWidth; x++) {
    for (let y = 0; y < rugHeight; y++) {
      const colorIndex =
        x == rugWidth - 1 ? 0 : (x * y * data[x]) % colors.length;
      const color = Jimp.rgbaToInt(
        colors[colorIndex][0],
        colors[colorIndex][1],
        colors[colorIndex][2],
        255,
      );

      const baseX = x * pixelSize;
      const baseY = y * pixelSize;

      image.scan(
        rugXMid - baseX,
        rugYMid - baseY,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(color, x, y);
        },
      );
      image.scan(
        rugXMid + baseX,
        rugYMid + baseY,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(color, x, y);
        },
      );
      image.scan(
        rugXMid - baseX,
        rugYMid + baseY,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(color, x, y);
        },
      );
      image.scan(
        rugXMid + baseX,
        rugYMid - baseY,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(color, x, y);
        },
      );
    }

    const trimColor = Jimp.rgbaToInt(
      colors[x % 2][0],
      colors[x % 2][1],
      colors[x % 2][2],
      255,
    );

    if (x % 2 == 0) {
      image.scan(
        rugXMid - x * pixelSize,
        rugYMid - (rugHeight + 1) * pixelSize,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(trimColor, x, y);
        },
      );
      image.scan(
        rugXMid + x * pixelSize,
        rugYMid - (rugHeight + 1) * pixelSize,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(trimColor, x, y);
        },
      );
      image.scan(
        rugXMid - x * pixelSize,
        rugYMid + (rugHeight + 1) * pixelSize,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(trimColor, x, y);
        },
      );
      image.scan(
        rugXMid + x * pixelSize,
        rugYMid + (rugHeight + 1) * pixelSize,
        pixelSize,
        pixelSize,
        function (x, y) {
          this.setPixelColor(trimColor, x, y);
        },
      );
    }

    image.scan(
      rugXMid + x * pixelSize,
      rugYMid - (rugHeight - 1) * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(bgColor, x, y);
      },
    );
    image.scan(
      rugXMid - x * pixelSize,
      rugYMid - (rugHeight - 1) * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(bgColor, x, y);
      },
    );
    image.scan(
      rugXMid + x * pixelSize,
      rugYMid + (rugHeight - 1) * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(bgColor, x, y);
      },
    );
    image.scan(
      rugXMid - x * pixelSize,
      rugYMid + (rugHeight - 1) * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(bgColor, x, y);
      },
    );
    image.scan(
      rugXMid + x * pixelSize,
      rugYMid - rugHeight * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(trimColor, x, y);
      },
    );
    image.scan(
      rugXMid - x * pixelSize,
      rugYMid - rugHeight * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(trimColor, x, y);
      },
    );
    image.scan(
      rugXMid + x * pixelSize,
      rugYMid + rugHeight * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(trimColor, x, y);
      },
    );
    image.scan(
      rugXMid - x * pixelSize,
      rugYMid + rugHeight * pixelSize,
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(trimColor, x, y);
      },
    );
  }

  const colorIndex =
    (rugWidth * rugHeight * data[rugWidth - 1]) % colors.length;

  const color = Jimp.rgbaToInt(
    colors[colorIndex][0],
    colors[colorIndex][1],
    colors[colorIndex][2],
    255,
  );

  for (let x = 0; x < rugWidth; x++) {
    image.scan(
      Math.floor(canvasWidth / 2 - pixelSize / 2 - x + pixelSize),
      Math.floor(canvasHeight / 2 - pixelSize / 2 - rugHeight + 1),
      pixelSize,
      pixelSize,
      function (x, y) {
        this.setPixelColor(color, x, y);
      },
    );
  }

  return await image.getBufferAsync(Jimp.MIME_PNG);
}

export async function savePixelArt(
  filename: string,
  randomHash?: string,
): Promise<Buffer> {
  const hash = randomHash ?? generateRandomHex();
  const imageData = await generatePixelArt(hash);

  if (process.env.NODE_ENV !== "production") {
    const filePath = path.join(process.cwd(), "public", "generated", filename);

    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, imageData);

    console.log(`Pixel art saved as ${filename}`);
  }

  return imageData;
}

export async function deletePixelArt(filename: string) {
  try {
    const filePath = path.join(process.cwd(), "public", "generated", filename);

    await fs.unlink(filePath);

    console.log(`Deleted pixel art: ${filename}`);
  } catch (err) {
    const message: string = "[deleteRug] Error: ";
    console.error(`${message} ${err}`);
    throw Error(`${message} ${err}`);
  }
}
