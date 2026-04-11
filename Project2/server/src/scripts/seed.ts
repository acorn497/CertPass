import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  createdAt: { type: Date, default: Date.now },
});

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnail: String,
  instructor: String,
  category_id: mongoose.Schema.Types.ObjectId,
  examName: String,
  level: String,
  price: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  totalDuration: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SectionSchema = new mongoose.Schema({
  course_id: mongoose.Schema.Types.ObjectId,
  title: String,
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

const EpisodeSchema = new mongoose.Schema({
  section_id: mongoose.Schema.Types.ObjectId,
  course_id: mongoose.Schema.Types.ObjectId,
  title: String,
  videoUrl: String,
  duration: Number,
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

const CategoryModel = mongoose.model('Category', CategorySchema);
const CourseModel = mongoose.model('Course', CourseSchema);
const SectionModel = mongoose.model('Section', SectionSchema);
const EpisodeModel = mongoose.model('Episode', EpisodeSchema);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('MongoDB 연결됨');

  // 기존 데이터 삭제
  await Promise.all([
    CategoryModel.deleteMany({}),
    CourseModel.deleteMany({}),
    SectionModel.deleteMany({}),
    EpisodeModel.deleteMany({}),
  ]);

  // 카테고리 생성
  const categories = await CategoryModel.insertMany([
    { name: 'IT', slug: 'it' },
    { name: '경제/금융', slug: 'finance' },
    { name: '어학', slug: 'language' },
    { name: '건설/부동산', slug: 'construction' },
    { name: '의료/보건', slug: 'medical' },
    { name: '법률/행정', slug: 'legal' },
  ]);

  const itCategory = categories.find((c) => c.slug === 'it')!;
  const financeCategory = categories.find((c) => c.slug === 'finance')!;
  const languageCategory = categories.find((c) => c.slug === 'language')!;

  // 강의 생성
  const courses = await CourseModel.insertMany([
    {
      title: '정보처리기사 완벽 대비 올인원',
      description: '필기부터 실기까지 한 번에 끝내는 정보처리기사 강의. 기출문제 분석과 핵심 이론을 체계적으로 학습하세요.',
      thumbnail:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '김정보',
      category_id: itCategory._id,
      examName: '정보처리기사',
      level: 'beginner',
      price: 0,
      isPublished: true,
      totalDuration: 72000,
    },
    {
      title: '정보보안기사 핵심 요약',
      description: '정보보안기사 합격을 위한 핵심 이론 및 기출 풀이 강의',
      thumbnail:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '이보안',
      category_id: itCategory._id,
      examName: '정보보안기사',
      level: 'intermediate',
      price: 0,
      isPublished: true,
      totalDuration: 54000,
    },
    {
      title: '토익 900점 달성 전략',
      description: 'RC/LC 파트별 공략법과 실전 모의고사로 토익 900점을 목표로',
      thumbnail:
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '박영어',
      category_id: languageCategory._id,
      examName: '토익',
      level: 'intermediate',
      price: 0,
      isPublished: true,
      totalDuration: 43200,
    },
    {
      title: '공인중개사 1차 핵심 강의',
      description: '공인중개사 1차 시험 부동산학개론 및 민법 핵심 정리',
      thumbnail:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '최공인',
      category_id: categories.find((c) => c.slug === 'construction')!._id,
      examName: '공인중개사',
      level: 'beginner',
      price: 0,
      isPublished: true,
      totalDuration: 64800,
    },
    {
      title: '재무관리사 합격 전략',
      description: '재무관리사 시험 대비 핵심 이론 및 문제 풀이',
      thumbnail:
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '정재무',
      category_id: financeCategory._id,
      examName: '재무관리사',
      level: 'beginner',
      price: 0,
      isPublished: true,
      totalDuration: 36000,
    },
  ]);

  // 정보처리기사 강의 섹션 및 에피소드 생성
  const ipcCourse = courses[0];
  const sections = await SectionModel.insertMany([
    { course_id: ipcCourse._id, title: '1과목. 소프트웨어 설계', order: 1 },
    { course_id: ipcCourse._id, title: '2과목. 소프트웨어 개발', order: 2 },
    { course_id: ipcCourse._id, title: '3과목. 데이터베이스 구축', order: 3 },
    { course_id: ipcCourse._id, title: '4과목. 프로그래밍 언어 활용', order: 4 },
    { course_id: ipcCourse._id, title: '5과목. 정보시스템 구축관리', order: 5 },
  ]);

  const episodeData: any[] = [];

  // 섹션별 에피소드 (제목 + 실제 YouTube ID + 재생시간)
  const sectionEpisodes: { title: string; videoUrl: string; duration: number }[][] = [
    // 1과목. 소프트웨어 설계
    [
      { title: '1-1. 소프트웨어 생명주기 모델', videoUrl: 'dQw4w9WgXcQ', duration: 212 },
      { title: '1-2. 애자일 방법론', videoUrl: '9bZkp7q19f0', duration: 253 },
      { title: '1-3. UML 다이어그램 개요', videoUrl: 'kJQP7kiw5Fk', duration: 278 },
      { title: '1-4. 디자인 패턴 기초', videoUrl: 'JGwWNGJdvx8', duration: 252 },
    ],
    // 2과목. 소프트웨어 개발
    [
      { title: '2-1. 데이터 입출력 구현', videoUrl: 'RgKAFK5djSk', duration: 263 },
      { title: '2-2. 통합 구현 및 인터페이스', videoUrl: 'OPf0YbXqDm0', duration: 235 },
      { title: '2-3. 제품 소프트웨어 패키징', videoUrl: 'fJ9rUzIMcZQ', duration: 271 },
      { title: '2-4. 애플리케이션 테스트', videoUrl: 'CevxZvSJLk8', duration: 229 },
    ],
    // 3과목. 데이터베이스 구축
    [
      { title: '3-1. 관계형 데이터베이스 개요', videoUrl: 'hT_nvWreIhg', duration: 233 },
      { title: '3-2. SQL 기본 문법', videoUrl: 'YQHsXMglC9A', duration: 379 },
      { title: '3-3. 정규화 이론', videoUrl: 'lp-EO5I60KA', duration: 247 },
      { title: '3-4. 트랜잭션과 동시성 제어', videoUrl: '60ItHLz5WEA', duration: 231 },
    ],
    // 4과목. 프로그래밍 언어 활용
    [
      { title: '4-1. C언어 기초 문법', videoUrl: 'bo_efYhYU2A', duration: 211 },
      { title: '4-2. Java 객체지향 개념', videoUrl: 'HP-MbfHFUqs', duration: 215 },
      { title: '4-3. Python 기초', videoUrl: 'y6120QOlsfU', duration: 340 },
      { title: '4-4. 운영체제 기본 개념', videoUrl: 'pRpeEdMmmQ0', duration: 215 },
    ],
    // 5과목. 정보시스템 구축관리
    [
      { title: '5-1. 소프트웨어 개발 보안', videoUrl: 'KMlJBEGALpI', duration: 357 },
      { title: '5-2. 암호화 알고리즘', videoUrl: 'DK_0jXPuIr0', duration: 189 },
      { title: '5-3. 네트워크 기본 개념', videoUrl: 'jNQXAC9IVRw', duration: 19 },
      { title: '5-4. IT 프로젝트 정보시스템 관리', videoUrl: 'ktvTqknDobU', duration: 251 },
    ],
  ];

  sections.forEach((section, si) => {
    sectionEpisodes[si].forEach((ep, i) => {
      episodeData.push({
        section_id: section._id as mongoose.Types.ObjectId,
        course_id: ipcCourse._id as mongoose.Types.ObjectId,
        title: ep.title,
        videoUrl: ep.videoUrl,
        duration: ep.duration,
        order: i + 1,
      });
    });
  });

  await EpisodeModel.insertMany(episodeData);

  console.log('✅ 시드 완료');
  console.log(`  카테고리: ${categories.length}개`);
  console.log(`  강의: ${courses.length}개`);
  console.log(`  섹션: ${sections.length}개`);
  console.log(`  에피소드: ${episodeData.length}개`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
