# CertPass — 프로젝트 2

자격증 시험 준비생을 위한 온라인 강의 플랫폼입니다.
P2에서는 수강생·강사·관리자 역할 분리, Refresh Token 기반 인증, 리뷰·Q&A 학습 기능을 추가했습니다.

---

## 저장소 구조

```
Project2/
  client/       React 19 프론트엔드 (Vite, TypeScript)
  server/       NestJS 11 백엔드 (TypeScript, MongoDB)

docs/P2/
  planning.md       기획서
  requirements.md   기능/비기능 요구사항
  api.md            API 엔드포인트 명세
  erd.md            데이터 모델 및 컬렉션 구조
  dev-log/          주차별 개발 일지
  presentation/
    project2-presentation.pdf   발표 자료
    FunctionTest.webm           기능 시연 영상
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, TypeScript, Vite, React Router, TanStack Query |
| 상태 관리 / API | Zustand, Axios, React Hook Form, Zod |
| 스타일 | Tailwind CSS |
| 백엔드 | NestJS 11, TypeScript, Mongoose |
| 데이터베이스 | MongoDB |
| 인증 | JWT, Refresh Token, bcrypt, cookie-parser |

---

## 실행 방법

### 사전 요구사항

- Node.js 20 이상
- MongoDB 실행 중 (`mongodb://localhost:27017`)

### 서버 실행

```bash
cd Project2/server
npm install
npm run seed        # DB 초기화 및 기본 데이터 삽입
npm run start:dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 클라이언트 실행

```bash
cd Project2/client
npm install
npm run dev
```

클라이언트는 `http://localhost:5173`에서 실행됩니다.

---

## 시연 가이드

### 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@certpass.test | password123 |
| 강사 | instructor@certpass.test | password123 |
| 수강생 | student@certpass.test | password123 |

> `npm run seed` 실행 시 위 계정과 샘플 강의 데이터가 자동 생성됩니다.

### 시연 순서

**수강생 계정으로 로그인**
1. `student@certpass.test`로 로그인
2. 강의 목록에서 강의 선택 → 강의 상세 확인
3. 수강 신청 후 영상 학습 및 진도율 확인
4. 리뷰 작성 (1~5점 평점 + 텍스트)
5. Q&A 질문 등록

**강사 계정으로 로그인**
6. `instructor@certpass.test`로 재로그인
7. `/instructor` 페이지에서 내 강의 목록, 수강자 수·평균 평점·진도 통계 확인

**관리자 계정으로 로그인**
8. `admin@certpass.test`로 재로그인
9. `/admin` 페이지에서 전체 회원 수·강의 수·수강 신청 수 확인

---

## GitHub

https://github.com/acorn497/CertPass
