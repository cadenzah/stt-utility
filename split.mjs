import fs from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pLimit from "p-limit";

const INPUT_DIR = "./audio";
const OUTPUT_DIR = "./splitted";
const CONCURRENCY = 4;

// 분할 기준 (초 단위)
const SPLIT_SECONDS = 60 * 30; // 30분

const limit = pLimit(CONCURRENCY);

/**
 * 오디오 길이 가져오기 (초)
 */
function getDuration(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
}

/**
 * 음원 분할 (변환 없음)
 */
async function splitAudio(inputPath) {
  const duration = await getDuration(inputPath);

  const ext = path.extname(inputPath);      // .wav / .m4a / .mp3
  const baseName = path.basename(inputPath, ext);

  // 분할 필요 없음 → 원본 그대로 복사
  if (duration <= SPLIT_SECONDS) {
    const outputPath = path.join(
      OUTPUT_DIR,
      `${baseName}${ext}`
    );

    await fs.copyFile(inputPath, outputPath);
    console.log(`✅ 분할 없음: ${baseName}${ext}`);
    return;
  }

  const totalParts = Math.ceil(duration / SPLIT_SECONDS);

  const tasks = Array.from({ length: totalParts }, (_, i) => {
    const start = i * SPLIT_SECONDS;
    const outputPath = path.join(
      OUTPUT_DIR,
      `${baseName}_${i + 1}${ext}`
    );

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(SPLIT_SECONDS)
        .outputOptions("-c copy") // ⭐ 재인코딩 없이 스트림 복사
        .output(outputPath)
        .on("end", () => {
          console.log(`✅ 생성: ${path.basename(outputPath)}`);
          resolve();
        })
        .on("error", reject)
        .run();
    });
  });

  await Promise.all(tasks);
}

/**
 * 메인
 */
async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const files = await fs.readdir(INPUT_DIR);

  const audioFiles = files.filter(file =>
    [".wav", ".m4a", ".mp3"].includes(path.extname(file).toLowerCase())
  );

  if (audioFiles.length === 0) {
    console.log("⚠️ 처리할 음원 파일이 없습니다.");
    return;
  }

  console.log(`🎧 ${audioFiles.length}개 음원 분할 시작`);

  await Promise.all(
    audioFiles.map(file =>
      limit(() =>
        splitAudio(path.join(INPUT_DIR, file))
      )
    )
  );

  console.log("🎉 모든 작업 완료");
}

main().catch(console.error);
