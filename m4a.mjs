import fs from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pLimit from "p-limit";

const INPUT_DIR = "./audio";
const OUTPUT_DIR = "./converted";
const CONCURRENCY = 4; // 병렬 개수 (CPU 따라 조절)

const limit = pLimit(CONCURRENCY);

async function convertWavToM4a(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("aac")
      .audioBitrate(192)
      .output(outputPath)
      .on("end", () => {
        console.log(`✅ 변환 완료: ${path.basename(outputPath)}`);
        resolve();
      })
      .on("error", reject)
      .run();
  });
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const files = await fs.readdir(INPUT_DIR);

  const wavFiles = files.filter(file =>
    file.toLowerCase().endsWith(".wav")
  );

  if (wavFiles.length === 0) {
    console.log("⚠️ 변환할 wav 파일이 없습니다.");
    return;
  }

  console.log(`🎧 ${wavFiles.length}개 wav 파일 변환 시작`);

  await Promise.all(
    wavFiles.map(file =>
      limit(() => {
        const inputPath = path.join(INPUT_DIR, file);
        const outputPath = path.join(
          OUTPUT_DIR,
          file.replace(/\.wav$/i, ".m4a")
        );
        return convertWavToM4a(inputPath, outputPath);
      })
    )
  );

  console.log("🎉 모든 변환 완료");
}

main().catch(console.error);
