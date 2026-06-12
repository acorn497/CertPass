import { Link } from 'react-router-dom';
import type { Course } from '../../types';

interface Props {
  course: Course;
  isEnrolled?: boolean;
}

const levelLabel: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

export function CourseCard({ course, isEnrolled }: Props) {
  return (
    <Link to={`/courses/${course._id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
        <div className="aspect-video bg-slate-100 overflow-hidden relative">
          {isEnrolled && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              수강 중
            </span>
          )}
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">
              {course.category?.name ?? '전체'}
            </span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
              {levelLabel[course.level] ?? course.level}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition">
            {course.title}
          </h3>
          <p className="text-sm text-slate-500">{course.instructor}</p>
          <div className="mt-3 flex items-center pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{course.examName}</span>
            <span className="ml-auto text-xs font-medium text-amber-600">
              ★ {(course.avgRating ?? 0).toFixed(1)} ({course.reviewCount ?? 0})
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
