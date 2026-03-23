# 개발계획서

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | CertPass |
| 단계 | P1 (MVP) |
| 작성일 | 2026-03-12 |

---

## 개발 환경

### 공통
- 언어: TypeScript
- 패키지 매니저: npm
- 버전 관리: Git / GitHub
- 코드 품질: ESLint, Prettier

### 프론트엔드

| 항목 | 버전/내용 |
|------|----------|
| 프레임워크 | React 19 |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS v4.1 |
| 서버 상태 관리 | TanStack Query (React Query) v5 |
| 클라이언트 상태 | Zustand |
| 라우팅 | React Router v6 |
| HTTP 클라이언트 | Axios |
| 폼 관리 | React Hook Form + Zod |

### 백엔드

| 항목 | 버전/내용 |
|------|----------|
| 런타임 | Node.js 24 LTS |
| 프레임워크 | NestJS |
| ODM | Mongoose 8 |
| 인증 | jsonwebtoken, bcrypt |
| 유효성 검사 | Zod |
| 환경 변수 | dotenv |

### 데이터베이스

| 항목 | 내용 |
|------|------|
| DBMS | MongoDB 7 (Atlas 무료 티어) |
| ODM | Mongoose |

---

## 프로젝트 디렉토리 구조

```
learnhub/
├── client/                  # 프론트엔드 (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/             # Axios 인스턴스 및 API 함수
│   │   ├── components/      # 공통 컴포넌트
│   │   │   ├── common/
│   │   │   ├── course/
│   │   │   └── layout/
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── stores/          # Zustand 스토어
│   │   ├── types/           # TypeScript 타입 정의
│   │   └── utils/
│   ├── index.html
│   └── vite.config.ts
│
└── server/                  # 백엔드 (NestJS)
    ├── src/
    │   ├── auth/            # 인증 모듈 (로그인, 회원가입, JWT)
    │   ├── users/           # 사용자 모듈
    │   ├── courses/         # 강의 모듈
    │   ├── enrollments/     # 수강 신청 모듈
    │   ├── progress/        # 학습 진도 모듈
    │   ├── common/          # 공통 데코레이터, 필터, 파이프
    │   └── main.ts
    ├── .env.example
    └── tsconfig.json
```

---

## 개발 일정

### Week 1 — 설계 및 문서화
- [x] 주제 선정
- [x] 기획서 작성
- [x] 요구사항 명세서 작성
- [x] ERD 설계
- [x] API 명세서 작성

### Week 2 — 백엔드 기초
- [x] 프로젝트 초기 세팅 (NestJS + TypeScript + MongoDB 연결)
- [x] Mongoose 모델 정의 (User, Course, Section, Episode, Enrollment, Progress)
- [x] 인증 API 구현 (회원가입, 로그인)
- [x] JWT Guard 구현

### Week 3 — 백엔드 기능 API
- [x] 강의 CRUD API 구현
- [x] 수강 신청 API 구현
- [x] 진도 저장/조회 API 구현
- [ ] API 테스트 (Postman / Thunder Client)

### Week 4 — 프론트엔드 기초
- [ ] React 프로젝트 세팅 (Vite + Tailwind + React Router)
- [ ] 공통 레이아웃 / 컴포넌트 구현 (Header, Footer, Button, Card)
- [ ] 회원가입 / 로그인 페이지 구현
- [ ] Axios 인스턴스 및 React Query 설정

### Week 5 — 프론트엔드 핵심 기능
- [ ] 강의 목록 / 상세 페이지 구현
- [ ] 수강 신청 기능 연동
- [ ] 내 강의실 페이지 구현
- [ ] 강의 플레이어 페이지 구현 (진도 저장 연동)

### Week 6 — 마무리 및 제출
- [ ] 마이페이지 구현
- [ ] 반응형 UI 검수
- [ ] 통합 테스트 및 버그 수정
- [ ] 배포 및 최종 제출

---

## 역할 분담

| 역할 | 담당 |
|------|------|
| 프론트엔드 | - |
| 백엔드 | - |
| 기획 / 문서 | - |

> P1은 개인 또는 소규모 팀 구성 기준으로 작성. 실제 팀 구성에 따라 조정.

---

## 브랜치 전략

```
main          ← 배포 브랜치
develop       ← 통합 개발 브랜치
feature/*     ← 기능 개발 브랜치 (예: feature/auth, feature/course-player)
fix/*         ← 버그 수정 브랜치
```

- PR은 `develop` 브랜치로 머지
- 커밋 메시지 컨벤션: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

---

## API 통신 규칙

- Base URL: `/api/v1`
- 인증: `Authorization: Bearer <token>` 헤더 사용
- 응답 형식:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
- 에러 응답:
  ```json
  {
    "success": false,
    "message": "에러 메시지"
  }
  ```
