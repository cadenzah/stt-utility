# stt-utility

## 사용 방법

### Speech-to-Text (/w NAVER Clova AI)
1. `/audio` 디렉토리를 생성하고, STT 변환할 음성 파일(들)을 해당 디렉토리에 넣기
2. `node stt.mjs` 실행

### 음성 파일 분할하기
1. `/audio` 디렉토리를 생성하고, 분할할 음성 파일(들)을 해당 디렉토래에 넣기
2. `node split.mjs` 실행 (기본 30분 단위)

### `.wav` -> `.m4a` 변환하기
1. `/audio` 디렉토리를 생성하고, 변환할 음성 파일(들)을 해당 디렉토래에 넣기
2. `node m4a.mjs` 실행 (`.m4a` 파일은 그대로 복사됨)
