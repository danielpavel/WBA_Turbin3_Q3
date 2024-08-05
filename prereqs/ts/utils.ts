import fs from "fs";

export function writeToFile(filePath: string, content: string) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Successfully wrote to ${filePath}`);
  } catch (error) {
    console.error(`❌ Error writing to file: ${error}`);
  }
}
