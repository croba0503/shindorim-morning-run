# 신도림중학교 아침달리기 웹사이트 - Vercel 무료 클라우드 배포 가이드

선생님 컴퓨터가 꺼져 있어도, 전교생이 스마트폰 LTE/5G 데이터로 언제 어디서나 24시간 접속할 수 있도록 **Vercel**에 무료로 배포하는 방법입니다.

---

## 📌 배포 절차 (약 3~5분 소요)

### 1단계: GitHub에 저장소 올리기
1. [GitHub (github.com)](https://github.com)에 로그인합니다. (계정이 없으시면 무료 가입)
2. 우측 상단 **[+]** 버튼 -> **[New repository]** 클릭
3. 저장소 이름(Repository name)에 `shindorim-morning-run` 입력 후 **[Create repository]** 클릭
4. 컴퓨터의 PowerShell(또는 명령 프롬프트)을 열고 아래 명령어를 순서대로 복사/붙여넣기 합니다:
   ```powershell
   cd C:\Users\user\Desktop\vive
   git branch -M main
   git remote add origin https://github.com/<본인의GitHub아이디>/shindorim-morning-run.git
   git push -u origin main
   ```

---

### 2단계: Vercel에서 무료 배포하기
1. [Vercel (vercel.com)](https://vercel.com)에 접속하여 **[Sign Up]** 또는 **[Log In]** (GitHub 계정으로 계속하기 클릭)
2. 대시보드에서 **[Add New...]** -> **[Project]** 클릭
3. 방금 올린 `shindorim-morning-run` 저장소 옆의 **[Import]** 버튼 클릭
4. 설정 변경 없이 그대로 파란색 **[Deploy]** 버튼 클릭!
5. 약 1분 후 배포가 완료되면 **`https://shindorim-morning-run-xxxx.vercel.app`** 형태의 무료 고유 도메인이 발급됩니다!

---

### 3단계: 클라우드 데이터 영구 저장소 연결 (1분 컷)
학생들의 신청 데이터와 마일리지가 클라우드에 영구 보존되도록 Vercel 무료 스토리지(KV / Upstash Redis)를 연결합니다.

1. 방금 배포 완료된 Vercel 프로젝트 대시보드 상단 메뉴에서 **[Storage]** 클릭
2. **[Create Database]** 클릭 -> **[KV]** (또는 Marketplace의 **Upstash Redis**) 선택
3. 무료(Free) 플랜 선택 후 **[Create]** 클릭
4. 생성이 끝나면 **[Connect to Project]** 버튼을 눌러 본인 프로젝트를 연결하면 끝!
   *(시스템이 자동으로 환경변수를 인식하여 클라우드 DB로 자동 전환됩니다)*

---

### 🎉 완료 후
- 발급받은 Vercel 도메인(예: `https://shindorim-morning-run.vercel.app`)을 학교 가정통신문, 포스터 QR코드 또는 운동장 본부석에 게시하시면 됩니다.
- 선생님 컴퓨터를 켜지 않아도 학생들은 언제 어디서나 접속할 수 있습니다!
