# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

가정용 소모품(칫솔, 치약, 우유, 휴지 등) 재고 관리 모바일 앱. 백엔드 없이 로컬 데이터베이스만 사용한다.

## Commands

```bash
flutter pub get          # Install dependencies
flutter run              # Run the app (prompts platform selection)
flutter test             # Run all tests
flutter test test/foo_test.dart  # Run a single test file
flutter analyze          # Lint / static analysis
flutter build apk        # Build Android APK
flutter build ios        # Build for iOS
flutter build web        # Build for web
```

## Architecture

Flutter cross-platform app (Android, iOS, macOS, Linux, Windows, Web).

### Tech Stack (planned)
- **State Management:** TBD
- **Local DB:** TBD (SQLite via drift/sqflite, or Isar, or Hive)
- **Barcode Scanning:** TBD (mobile_scanner or flutter_barcode_scanner)
- **UI:** Material Design 3

### Key Domains
- **아이템 관리:** 바코드 또는 수동 입력으로 소모품 등록/수정/삭제
- **재고 추적:** 수량 관리, 사용기한 추적
- **검색:** 바코드 촬영 검색, 이름 텍스트 검색
- **저장 위치:** 아이템별 보관 장소 관리

### App ID
`com.example.inventory` — 배포 전 변경 필요

## Docs
- `docs/requirements.md` — 요구사항 명세서
