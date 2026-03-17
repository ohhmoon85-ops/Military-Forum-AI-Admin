# 군사논단 AI Admin System

[![CI](https://github.com/ohhmoon85-ops/Military-Forum-AI-Admin/actions/workflows/ci.yml/badge.svg)](https://github.com/ohhmoon85-ops/Military-Forum-AI-Admin/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

> **사단법인 한국군사학회** 계간 *군사논단* 투고 관리 시스템
> 기고문 접수 → AI 평가 → 표절 검사 → 서식 수정 → 재투고 피드백까지 **전 과정 자동화**

---

## 주요 기능

| Phase | 기능 | 설명 |
|-------|------|------|
| **1** | 대시보드 | 투고 현황 통계, 워크플로우 스테퍼, 최근 접수 테이블 |
| **2** | 기고문 업로드 | PDF/DOCX 드래그 앤 드롭, 서버 사이드 텍스트 추출, 형식 준수 자동 검사 |
| **3** | AI 평가 분석 | Claude AI 5개 항목 채점(100점), Executive Summary, 표절 위험도, 재투고 로드맵 |
| **4** | 양식 수정·Diff | 군사 용어 표준화, 문장부호 교정, Side-by-Side Diff 뷰어, PDF 인쇄 다운로드 |
| **5** | 배포·문서 | Vercel 배포, GitHub Actions CI, 보안 헤더, 환경 변수 관리 |

---

## 스크린샷

```
┌─────────────────────────────────────────────────────────────────┐
│  군사논단 AI Admin   [알림🔔]  [관리자 ▾]           네이비 GNB    │
├────────────┬────────────────────────────────────────────────────┤
│            │  대시보드                                           │
│ 대시보드   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│ 기고문 업로드│  │총 47건│ │완료32│ │선정12│ │미선8 │  통계 카드  │
│ AI 평가   │  └──────┘ └──────┘ └──────┘ └──────┘             │
│ 양식 수정 │                                                      │
│ 재투고피드백  워크플로우: ①접수 → ②AI평가 → ③수정 → ④피드백   │
│ 투고 규정 │                                                      │
│ 통계 리포트  최근 투고 기고문 테이블 (AI 점수 바 포함)             │
│ 시스템 설정│                                                      │
└────────────┴────────────────────────────────────────────────────┘
```

---

## 기술 스택

```
Frontend     Next.js 14 (App Router) · TypeScript · Tailwind CSS · Lucide React
AI Engine    @anthropic-ai/sdk (Claude Opus 4.5 / Haiku)
Text Parse   pdf-parse · mammoth (PDF/DOCX 추출)
Diff View    diff (word-level 변경 감지)
Form         React Hook Form · Zod
Deploy       Vercel (Seoul icn1 리전) · GitHub Actions
```

---

## 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/ohhmoon85-ops/Military-Forum-AI-Admin.git
cd Military-Forum-AI-Admin
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열고 아래 값을 입력합니다:

```env
# Claude API 키 (https://console.anthropic.com 에서 발급)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx

# API 키 없이 샘플 결과 확인 시 true
DEMO_MODE=false
```

> **API 키 없이도 실행 가능합니다.**
> `DEMO_MODE=true` 또는 `ANTHROPIC_API_KEY` 미설정 시 자동으로 데모 모드로 전환되어 샘플 평가 결과를 보여줍니다.

### 3. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000 접속
```

---

## Vercel 배포

### 방법 1 — Vercel 대시보드 (권장)

1. [vercel.com](https://vercel.com) 로그인 후 **"Add New Project"**
2. GitHub 저장소 `ohhmoon85-ops/Military-Forum-AI-Admin` 연결
3. **Environment Variables** 추가:
   | 키 | 값 |
   |---|---|
   | `ANTHROPIC_API_KEY` | Claude API 키 |
   | `DEMO_MODE` | `false` |
4. **Deploy** 클릭

### 방법 2 — CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 환경 변수 CLI 등록

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add DEMO_MODE production
```

---

## GitHub Actions 설정 (선택)

PR Preview 자동 배포를 원한다면 GitHub Secrets에 추가하세요:

| Secret | 설명 | 위치 |
|--------|------|------|
| `VERCEL_TOKEN` | Vercel 액세스 토큰 | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | 조직 ID | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | 프로젝트 ID | `.vercel/project.json` |

> `vercel link` 실행 후 `.vercel/project.json`에서 ID를 확인할 수 있습니다.

---

## 프로젝트 구조

```
military-forum-admin/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃 (GNB + Sidebar)
│   ├── page.tsx                # 대시보드 홈
│   ├── upload/page.tsx         # Phase 2: 기고문 업로드
│   ├── evaluation/page.tsx     # Phase 3: AI 평가·분석
│   ├── formatting/page.tsx     # Phase 4: 서식 수정·Diff
│   ├── feedback/page.tsx       # Phase 3: 재투고 피드백
│   ├── guidelines/page.tsx     # 투고 규정 전문
│   └── api/
│       ├── extract/route.ts    # 파일 텍스트 추출 (pdf-parse / mammoth)
│       ├── evaluate/route.ts   # Claude AI 기고문 평가
│       ├── feedback/route.ts   # 재투고 로드맵 생성
│       └── format/route.ts     # 서식 자동 변환
│
├── components/
│   ├── layout/                 # GNB, Sidebar, MainLayout
│   ├── dashboard/              # StatCard, WorkflowStepper, RecentSubmissions
│   ├── upload/                 # DropZone, FileCard, UploadClient
│   ├── evaluation/             # EvaluationClient, ScorePanel, SummaryPanel,
│   │                           #   PlagiarismPanel, FeedbackPanel
│   └── formatting/             # FormattingClient, DiffViewer
│
├── lib/
│   ├── utils.ts                # cn(), formatDate(), 상태 레이블
│   ├── format-rules.ts         # 서식 규칙 엔진 + 군사 용어 사전
│   ├── demo-papers.ts          # 5건 샘플 기고문 데이터
│   └── types/
│       └── evaluation.ts       # TypeScript 타입 정의
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # 빌드·타입체크·린트
│   │   └── deploy-preview.yml  # PR Preview 자동 배포
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│
├── .env.local.example          # 환경 변수 템플릿
├── vercel.json                 # Vercel 배포 설정
├── next.config.mjs             # Next.js 설정 (보안 헤더 포함)
└── tailwind.config.ts          # 군사학회 네이비 블루 테마
```

---

## API 레퍼런스

### `POST /api/extract`
PDF·DOCX 파일을 업로드하여 텍스트를 추출합니다.

```http
Content-Type: multipart/form-data
Body: file=<File>
```

```json
// Response
{
  "success": true,
  "text": "...",
  "preview": "앞 800자...",
  "pageCount": 22,
  "analysis": {
    "estimatedPages": 22,
    "charCount": 37400,
    "compliance": { "pageRange": true, "hasAbstract": true, "hasReferences": true },
    "categories": ["국방정책", "북한·주변국"]
  }
}
```

### `POST /api/evaluate`
기고문 텍스트를 Claude AI로 평가합니다. API 키 미설정 시 데모 결과를 반환합니다.

```json
// Request
{ "title": "기고문 제목", "text": "본문 텍스트" }

// Response
{
  "result": {
    "total_score": 82,
    "recommendation": "revision",
    "scores": { "topic_relevance": { "score": 24, "max": 30, "comment": "..." }, ... },
    "executive_summary": { "background": "...", "main_argument": "...", ... },
    "plagiarism": { "similarity_estimate": 8, "risk_level": "low", ... },
    "feedback_roadmap": [{ "priority": "high", "issue": "...", "suggestion": "..." }]
  },
  "demo": false
}
```

### `POST /api/format`
서식 규칙을 적용하여 기고문 텍스트를 변환합니다.

```json
// Request
{
  "text": "원본 텍스트",
  "title": "기고문 제목",
  "options": {
    "normalizeWhitespace": true,
    "fixPunctuation": true,
    "standardizeTerms": true,
    "normalizeHeadings": true,
    "refineTone": false
  }
}

// Response
{
  "original": "원본 텍스트",
  "formatted": "서식 적용된 텍스트",
  "logs": [{ "rule": "군사 전문 용어 표준화", "count": 5, "examples": ["UAV → 무인항공기(UAV)"] }],
  "stats": { "totalRules": 3, "totalChanges": 12, "charDiff": 42 }
}
```

---

## 평가 기준 및 배점

| 항목 | 배점 | 내용 |
|------|------|------|
| 주제 적합성 | 30점 | 군사학 이론·국방정책·북한·주변국·방위산업 관련성 |
| 논리성·체계성 | 25점 | 논증 타당성, 체계적 구성, 문장 명확성 |
| 학술적 기여도 | 20점 | 독창성, 새로운 시각 제시, 실용적 가치 |
| 형식 준수도 | 15점 | A4 20~25매, 한영 Abstract, 핵심어 포함 |
| 참고문헌 | 10점 | 최신성, 다양성, 인용 형식 정확성 |

**판정 기준:** 85점↑ 게재 확정 · 65~84점 수정 후 재심사 · 64점↓ 미선정

---

## 라이선스

MIT License © 2025 사단법인 한국군사학회

---

## 문의

- **학회 홈페이지**: http://www.kaoms.or.kr
- **투고 이메일**: kaoms@naver.com
- **대표전화**: 02-795-2077
