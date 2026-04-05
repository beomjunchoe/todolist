# 공유형 주간 투두

카카오 로그인으로 접속해서 개인 투두를 만들고, 항목별로 공개/비공개를 정한 뒤 주간 체크를 할 수 있는 Next.js 웹앱입니다.

## 기능

- 카카오 OAuth 로그인
- 사용자별 개인 투두 목록
- 투두별 공개 / 비공개 전환
- 7일 단위 주간 체크 그리드
- 공개된 항목만 보여주는 공유 보드

## 실행

```bash
npm install
npm run dev
```

## 환경 변수

```bash
DATABASE_URL="file:./dev.db"
KAKAO_REST_API_KEY=""
KAKAO_CLIENT_SECRET=""
KAKAO_REDIRECT_URI="http://localhost:3000/api/auth/kakao/callback"
ADMIN_KAKAO_IDS=""
ADMIN_USER_IDS=""
```

`ADMIN_KAKAO_IDS`에는 관리자 카카오 ID를 쉼표로 구분해서 넣습니다. 예:

```bash
ADMIN_KAKAO_IDS="123456789,987654321"
```

`ADMIN_USER_IDS`로 앱 내부 사용자 ID를 넣어도 관리자 지정이 됩니다. 카카오 ID가 헷갈리면 로그인 후 사이드바에 표시되는 내부 ID를 그대로 넣으면 됩니다.

## 카카오 개발자 콘솔 설정

1. 카카오 개발자 콘솔에서 `카카오 로그인`을 활성화합니다.
2. Redirect URI에 `http://localhost:3000/api/auth/kakao/callback`를 등록합니다.
3. 앱 동의항목에서 프로필 닉네임, 프로필 이미지를 허용합니다.
