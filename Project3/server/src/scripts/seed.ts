import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  isEmailVerified: Boolean,
  refreshToken: { type: String, default: null },
  emailVerifyToken: { type: String, default: null },
  oauthProvider: { type: String, default: null },
  oauthId: { type: String, default: null },
}, { timestamps: true });

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnail: String,
  instructor: String,
  instructor_id: mongoose.Schema.Types.ObjectId,
  category_id: mongoose.Schema.Types.ObjectId,
  examName: String,
  level: String,
  price: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  status: { type: String, default: 'approved' },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalDuration: Number,
  sections: {
    type: [
      {
        title: String,
        order: Number,
        episodes: [
          {
            title: String,
            videoUrl: String,
            duration: Number,
            order: Number,
          },
        ],
      },
    ],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ExamSchema = new mongoose.Schema({
  course_id: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  timeLimit: Number,
  examDate: Date,
  question_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdAt: { type: Date, default: Date.now },
});

const QuestionSchema = new mongoose.Schema({
  course_id: mongoose.Schema.Types.ObjectId,
  content: String,
  options: [String],
  answer: Number,
  explanation: String,
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

const EnrollmentSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  course_id: mongoose.Schema.Types.ObjectId,
  enrolledAt: { type: Date, default: Date.now },
});

const ReviewSchema = new mongoose.Schema(
  {
    user_id: mongoose.Schema.Types.ObjectId,
    course_id: mongoose.Schema.Types.ObjectId,
    rating: Number,
    content: String,
  },
  { timestamps: true },
);

const QnaPostSchema = new mongoose.Schema(
  {
    user_id: mongoose.Schema.Types.ObjectId,
    course_id: mongoose.Schema.Types.ObjectId,
    title: String,
    content: String,
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const QnaCommentSchema = new mongoose.Schema(
  {
    post_id: mongoose.Schema.Types.ObjectId,
    user_id: mongoose.Schema.Types.ObjectId,
    content: String,
    isInstructor: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const InstructorApplicationSchema = new mongoose.Schema(
  {
    user_id: mongoose.Schema.Types.ObjectId,
    motivation: String,
    status: { type: String, default: 'pending' },
    reviewNote: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const UserModel = mongoose.model('User', UserSchema);
const CategoryModel = mongoose.model('Category', CategorySchema);
const CourseModel = mongoose.model('Course', CourseSchema);
const ExamModel = mongoose.model('Exam', ExamSchema);
const QuestionModel = mongoose.model('Question', QuestionSchema);
const EnrollmentModel = mongoose.model('Enrollment', EnrollmentSchema);
const ReviewModel = mongoose.model('Review', ReviewSchema);
const QnaPostModel = mongoose.model('QnaPost', QnaPostSchema);
const QnaCommentModel = mongoose.model('QnaComment', QnaCommentSchema);
const InstructorApplicationModel = mongoose.model(
  'InstructorApplication',
  InstructorApplicationSchema,
);

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// 무작위 데이터 생성용 헬퍼
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const pickMany = <T>(arr: T[], n: number): T[] => shuffle(arr).slice(0, n);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('MongoDB 연결됨');

  // 기존 데이터 삭제
  await Promise.all([
    CategoryModel.deleteMany({}),
    CourseModel.deleteMany({}),
    UserModel.deleteMany({}),
    ExamModel.deleteMany({}),
    QuestionModel.deleteMany({}),
    EnrollmentModel.deleteMany({}),
    ReviewModel.deleteMany({}),
    QnaPostModel.deleteMany({}),
    QnaCommentModel.deleteMany({}),
    InstructorApplicationModel.deleteMany({}),
  ]);

  const password = await bcrypt.hash('password123', 10);
  const [admin, instructor, student] = await UserModel.insertMany([
    {
      email: 'admin@certpass.com',
      password,
      name: '관리자',
      role: 'admin',
      isEmailVerified: true,
    },
    {
      email: 'instructor@certpass.com',
      password,
      name: '김정보',
      role: 'instructor',
      isEmailVerified: true,
    },
    {
      email: 'student@certpass.com',
      password,
      name: '수강생',
      role: 'student',
      isEmailVerified: true,
    },
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
      instructor_id: instructor._id,
      category_id: itCategory._id,
      examName: '정보처리기사',
      level: 'beginner',
      price: 0,
      isPublished: true,
      status: 'approved',
      totalDuration: 72000,
    },
    {
      title: '정보보안기사 핵심 요약',
      description: '정보보안기사 합격을 위한 핵심 이론 및 기출 풀이 강의',
      thumbnail:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '이보안',
      instructor_id: instructor._id,
      category_id: itCategory._id,
      examName: '정보보안기사',
      level: 'intermediate',
      price: 49000,
      isPublished: true,
      status: 'approved',
      totalDuration: 54000,
    },
    {
      title: '토익 900점 달성 전략',
      description: 'RC/LC 파트별 공략법과 실전 모의고사로 토익 900점을 목표로',
      thumbnail:
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '박영어',
      instructor_id: instructor._id,
      category_id: languageCategory._id,
      examName: '토익',
      level: 'intermediate',
      price: 0,
      isPublished: true,
      status: 'approved',
      totalDuration: 43200,
    },
    {
      title: '공인중개사 1차 핵심 강의',
      description: '공인중개사 1차 시험 부동산학개론 및 민법 핵심 정리',
      thumbnail:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '최공인',
      instructor_id: instructor._id,
      category_id: categories.find((c) => c.slug === 'construction')!._id,
      examName: '공인중개사',
      level: 'beginner',
      price: 0,
      isPublished: true,
      status: 'approved',
      totalDuration: 64800,
    },
    {
      title: '재무관리사 합격 전략',
      description: '재무관리사 시험 대비 핵심 이론 및 문제 풀이',
      thumbnail:
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '정재무',
      instructor_id: instructor._id,
      category_id: financeCategory._id,
      examName: '재무관리사',
      level: 'beginner',
      price: 0,
      isPublished: true,
      status: 'approved',
      totalDuration: 36000,
    },
    {
      title: 'SQLD 자격증 한 번에 합격하기',
      description: '데이터 모델링부터 SQL 활용까지, SQLD 합격에 필요한 모든 것을 담은 유료 강의',
      thumbnail:
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '김정보',
      instructor_id: instructor._id,
      category_id: itCategory._id,
      examName: 'SQLD',
      level: 'intermediate',
      price: 39000,
      isPublished: true,
      status: 'approved',
      totalDuration: 50400,
    },
    {
      title: 'ADsP 데이터분석 준전문가 완성',
      description: '데이터 분석 기획과 통계 기초를 체계적으로 정리한 ADsP 대비 프리미엄 강의',
      thumbnail:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '김정보',
      instructor_id: instructor._id,
      category_id: itCategory._id,
      examName: 'ADsP',
      level: 'beginner',
      price: 55000,
      isPublished: true,
      status: 'approved',
      totalDuration: 46800,
    },
    {
      title: '토익 스피킹 레벨7 집중반',
      description: '실전 답변 템플릿과 모범 답안으로 토익 스피킹 고득점을 노리는 유료 집중 과정',
      thumbnail:
        'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&h=450&fit=crop&auto=format&q=80',
      instructor: '박영어',
      instructor_id: instructor._id,
      category_id: languageCategory._id,
      examName: '토익스피킹',
      level: 'advanced',
      price: 69000,
      isPublished: true,
      status: 'approved',
      totalDuration: 32400,
    },
  ]);

  const ipcCourse = courses[0];
  const sections = [
    {
      title: '1과목. 소프트웨어 설계',
      order: 1,
      episodes: [
        { title: '1-1. 소프트웨어 생명주기 모델', videoUrl: 'dQw4w9WgXcQ', duration: 212, order: 1 },
        { title: '1-2. 애자일 방법론', videoUrl: '9bZkp7q19f0', duration: 253, order: 2 },
        { title: '1-3. UML 다이어그램 개요', videoUrl: 'kJQP7kiw5Fk', duration: 278, order: 3 },
        { title: '1-4. 디자인 패턴 기초', videoUrl: 'JGwWNGJdvx8', duration: 252, order: 4 },
      ],
    },
    {
      title: '2과목. 소프트웨어 개발',
      order: 2,
      episodes: [
        { title: '2-1. 데이터 입출력 구현', videoUrl: 'RgKAFK5djSk', duration: 263, order: 1 },
        { title: '2-2. 통합 구현 및 인터페이스', videoUrl: 'OPf0YbXqDm0', duration: 235, order: 2 },
        { title: '2-3. 제품 소프트웨어 패키징', videoUrl: 'fJ9rUzIMcZQ', duration: 271, order: 3 },
        { title: '2-4. 애플리케이션 테스트', videoUrl: 'CevxZvSJLk8', duration: 229, order: 4 },
      ],
    },
    {
      title: '3과목. 데이터베이스 구축',
      order: 3,
      episodes: [
        { title: '3-1. 관계형 데이터베이스 개요', videoUrl: 'hT_nvWreIhg', duration: 233, order: 1 },
        { title: '3-2. SQL 기본 문법', videoUrl: 'YQHsXMglC9A', duration: 379, order: 2 },
        { title: '3-3. 정규화 이론', videoUrl: 'lp-EO5I60KA', duration: 247, order: 3 },
        { title: '3-4. 트랜잭션과 동시성 제어', videoUrl: '60ItHLz5WEA', duration: 231, order: 4 },
      ],
    },
    {
      title: '4과목. 프로그래밍 언어 활용',
      order: 4,
      episodes: [
        { title: '4-1. C언어 기초 문법', videoUrl: 'bo_efYhYU2A', duration: 211, order: 1 },
        { title: '4-2. Java 객체지향 개념', videoUrl: 'HP-MbfHFUqs', duration: 215, order: 2 },
        { title: '4-3. Python 기초', videoUrl: 'y6120QOlsfU', duration: 340, order: 3 },
        { title: '4-4. 운영체제 기본 개념', videoUrl: 'pRpeEdMmmQ0', duration: 215, order: 4 },
      ],
    },
    {
      title: '5과목. 정보시스템 구축관리',
      order: 5,
      episodes: [
        { title: '5-1. 소프트웨어 개발 보안', videoUrl: 'KMlJBEGALpI', duration: 357, order: 1 },
        { title: '5-2. 암호화 알고리즘', videoUrl: 'DK_0jXPuIr0', duration: 189, order: 2 },
        { title: '5-3. 네트워크 기본 개념', videoUrl: 'jNQXAC9IVRw', duration: 19, order: 3 },
        { title: '5-4. IT 프로젝트 정보시스템 관리', videoUrl: 'ktvTqknDobU', duration: 251, order: 4 },
      ],
    },
  ];
  const episodeCount = sections.reduce((sum, section) => sum + section.episodes.length, 0);
  const totalDuration = sections.reduce(
    (sum, section) =>
      sum + section.episodes.reduce((episodeSum, episode) => episodeSum + episode.duration, 0),
    0,
  );
  await CourseModel.findByIdAndUpdate(ipcCourse._id, { sections, totalDuration });

  const exam = await ExamModel.create({
    course_id: ipcCourse._id,
    title: '정보처리기사 1회 모의고사',
    description: 'P2 샘플 모의고사',
    timeLimit: 30,
    examDate: futureDate(5),
    question_ids: [],
  });

  const questions = await QuestionModel.insertMany([
    {
      course_id: ipcCourse._id,
      content: '소프트웨어 생명주기 모델에 해당하는 것은?',
      options: ['폭포수 모델', '정규화', '인덱싱', '라우팅'],
      answer: 0,
      explanation: '폭포수 모델은 대표적인 소프트웨어 생명주기 모델입니다.',
      order: 1,
    },
    {
      course_id: ipcCourse._id,
      content: '관계형 데이터베이스에서 중복을 줄이는 설계 과정은?',
      options: ['컴파일', '정규화', '렌더링', '배포'],
      answer: 1,
      explanation: '정규화는 데이터 중복과 이상 현상을 줄이는 설계 과정입니다.',
      order: 2,
    },
  ]);
  await ExamModel.findByIdAndUpdate(exam._id, {
    question_ids: questions.map((question) => question._id),
  });

  // ===== 무작위 학생 계정 =====
  const studentNames = [
    '김민준', '이서연', '박도윤', '최지우', '정하준', '강서아',
    '조은우', '윤지호', '임수아', '한예준', '오유진', '서지안',
  ];
  const randomStudents = await UserModel.insertMany(
    studentNames.map((name, i) => ({
      email: `student${i + 1}@certpass.com`,
      password,
      name,
      role: 'student',
      isEmailVerified: true,
    })),
  );
  const allStudents = [student, ...randomStudents];

  // ===== 수강 등록 (학생별 1~3개 강의) =====
  const enrollmentDocs: any[] = [];
  for (const s of allStudents) {
    for (const c of pickMany(courses, randInt(1, 3))) {
      enrollmentDocs.push({ user_id: s._id, course_id: c._id });
    }
  }
  await EnrollmentModel.insertMany(enrollmentDocs);

  // ===== 리뷰 (수강생의 약 60%가 작성) + 강의 평점 집계 =====
  const reviewContents = [
    '설명이 정말 깔끔하고 이해가 쏙쏙 됩니다. 추천해요!',
    '기출 분석이 알차서 시험에 큰 도움이 됐어요.',
    '강의 속도가 적당하고 예시가 많아 좋았습니다.',
    '핵심만 짚어줘서 단기간에 정리하기 좋네요.',
    '조금 어려운 부분도 있지만 전반적으로 만족합니다.',
    '입문자도 따라가기 쉬운 강의예요.',
  ];
  const reviewDocs: any[] = [];
  for (const e of enrollmentDocs) {
    if (Math.random() < 0.6) {
      reviewDocs.push({
        user_id: e.user_id,
        course_id: e.course_id,
        rating: randInt(3, 5),
        content: pick(reviewContents),
      });
    }
  }
  await ReviewModel.insertMany(reviewDocs);

  // 강의별 평점/리뷰수 집계 반영
  for (const c of courses) {
    const courseReviews = reviewDocs.filter((r) => String(r.course_id) === String(c._id));
    if (courseReviews.length) {
      const avg = courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length;
      await CourseModel.findByIdAndUpdate(c._id, {
        avgRating: Math.round(avg * 10) / 10,
        reviewCount: courseReviews.length,
      });
    }
  }

  // ===== Q&A 게시글 + 댓글 =====
  const qnaTemplates = [
    { title: '강의 자료는 어디서 받나요?', content: '수업에서 보여주신 PDF 자료 다운로드 위치가 궁금합니다.' },
    { title: '3과목 정규화 질문 있습니다', content: '제3정규형과 BCNF 차이가 헷갈리는데 설명 부탁드려요.' },
    { title: '시험 범위 관련 문의', content: '이번 회차 시험 범위에 5과목도 포함되나요?' },
    { title: '예제 코드 오류 문의', content: '4-2 강의 예제 코드가 컴파일이 안 되는데 확인 부탁드립니다.' },
  ];
  const commentTemplates = [
    '저도 같은 점이 궁금했어요!',
    '강의 다시 보니 이해됐습니다. 감사합니다.',
    '좋은 질문이네요. 답변 기다려봅니다.',
  ];
  let qnaCount = 0;
  let commentCount = 0;
  for (const c of courses) {
    for (const tpl of pickMany(qnaTemplates, randInt(1, 2))) {
      const post = await QnaPostModel.create({
        user_id: pick(allStudents)._id,
        course_id: c._id,
        title: tpl.title,
        content: tpl.content,
        isResolved: Math.random() < 0.4,
      });
      qnaCount++;
      // 강사 답변
      await QnaCommentModel.create({
        post_id: post._id,
        user_id: instructor._id,
        content: '안녕하세요, 문의 주셔서 감사합니다. 해당 내용은 강의자료실을 확인해주세요!',
        isInstructor: true,
      });
      commentCount++;
      // 학생 댓글 0~2개
      for (let i = 0; i < randInt(0, 2); i++) {
        await QnaCommentModel.create({
          post_id: post._id,
          user_id: pick(allStudents)._id,
          content: pick(commentTemplates),
          isInstructor: false,
        });
        commentCount++;
      }
    }
  }

  // ===== 강사 신청 (pending 2건, 승인 테스트용) =====
  const applicants = pickMany(randomStudents, 2);
  await InstructorApplicationModel.insertMany(
    applicants.map((a) => ({
      user_id: a._id,
      motivation: '실무 경력을 바탕으로 양질의 강의를 제작하고 싶어 강사를 신청합니다.',
      status: 'pending',
    })),
  );

  console.log('✅ 시드 완료');
  console.log(`  사용자: ${allStudents.length + 2}개 (관리자1, 강사1, 학생${allStudents.length})`);
  console.log(`  카테고리: ${categories.length}개`);
  console.log(`  강의: ${courses.length}개`);
  console.log(`  섹션: ${sections.length}개 / 에피소드: ${episodeCount}개`);
  console.log(`  수강등록: ${enrollmentDocs.length}건 / 리뷰: ${reviewDocs.length}개`);
  console.log(`  Q&A 글: ${qnaCount}개 / 댓글: ${commentCount}개`);
  console.log(`  강사 신청: ${applicants.length}건 (pending)`);
  console.log('  로그인: admin@certpass.com / instructor@certpass.com / student@certpass.com (password123)');
  console.log('  무작위 학생: student1~12@certpass.com (password123)');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
