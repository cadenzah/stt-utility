import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AUDIO_DIR = "./audio";
const OUTPUT_DIR = "./output";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

async function transcribeFile(filePath) {
  const fileName = path.basename(filePath);
  const outputFile = path.join(
    OUTPUT_DIR,
    `${path.parse(fileName).name}.txt`
  );

  console.log(`▶️ STT 시작: ${fileName}`);

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    language: "ko",
    response_format: "text",
  });

  fs.writeFileSync(outputFile, transcription, "utf-8");

  console.log(`✅ 완료: ${fileName} → ${outputFile}`);
}

async function run() {
  const files = fs
    .readdirSync(AUDIO_DIR)
    .filter((file) =>
      [".mp3", ".m4a", ".wav", ".aac"].includes(path.extname(file))
    );

  for (const file of files) {
    const filePath = path.join(AUDIO_DIR, file);

    try {
      await transcribeFile(filePath);
    } catch (err) {
      console.error(`❌ 실패: ${file}`, err.message);
    }
  }

  console.log("🎉 모든 파일 처리 완료");
}

run();
