export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  profileImage: string | null;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  instructor: string;
  category: Category;
  examName: string;
  level: string;
  price: number;
  totalDuration: number;
  episodeCount?: number;
}

export interface Section {
  _id: string;
  title: string;
  order: number;
  episodes: Episode[];
}

export interface Episode {
  _id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
}

export interface CourseDetail extends Course {
  sections: Section[];
}

export interface EpisodeDetail {
  _id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  section: {
    _id: string;
    title: string;
    order: number;
  };
}

export interface Enrollment {
  _id: string;
  enrolledAt: string;
}

export interface EnrollmentWithProgress {
  enrollment: Enrollment;
  course: Pick<Course, '_id' | 'title' | 'thumbnail' | 'instructor' | 'examName'>;
  progress: {
    completedCount: number;
    totalCount: number;
    percentage: number;
    lastWatchedEpisodeId: string | null;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
