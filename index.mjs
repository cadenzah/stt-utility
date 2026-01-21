import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

import '@dotenvx/dotenvx/config';

// const AUDIO_DIR = "./audio";
const AUDIO_DIR = "./sample";
const OUTPUT_DIR = "./output";

const INVOKE_URL = process.env.CLOVA_INVOKE_URL; 
const SECRET_KEY = process.env.SECRET_KEY; // Secret Key (domain builder에서 발급된 Secret)

if (!INVOKE_URL || !SECRET_KEY) {
  console.error("❌ INVOKE_URL / SECRET_KEY 필요");
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

async function transcribeFile(filePath) {
  const filename = path.basename(filePath);
  const outPath = path.join(OUTPUT_DIR, `${path.parse(filename).name}.txt`);

  console.log(`▶️ STT 요청: ${filename}`);

  const requestBody = {
    language: "ko-KR",
    completion: "sync",
    callback: "",
    userdata: "",
    wordAlignment: true,
    fullText: true,
  };

  const form = new FormData();
  form.append("media", fs.createReadStream(filePath));
  form.append("params", JSON.stringify(requestBody), {
    contentType: "application/json",
  });

  try {
    const res = await axios.post(
      `${INVOKE_URL}/recognizer/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-CLOVASPEECH-API-KEY": SECRET_KEY,
        },
        maxBodyLength: Infinity,
        timeout: 0,
      }
    );

    // Python 예시처럼 JSON이 response body로 옴
    const data = res.data;
    const text = data.text ?? "";
    fs.writeFileSync(outPath, text, "utf-8");

    console.log(`✅ 저장됨: ${outPath}`);
  } catch (err) {
    console.error(`❌ 실패: ${filename}`);
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

async function run() {
  const files = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => /\.(mp3|wav|m4a|aac)$/i.test(f));

  for (const f of files) {
    await transcribeFile(path.join(AUDIO_DIR, f));
  }
  console.log("🎉 모든 파일 처리 완료");
}

run();
