import { Link } from 'react-router-dom';
import type { Course } from '../../types';

interface Props {
  course: Course;
}

const levelLabel: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

export function CourseCard({ course }: Props) {
  return (
    <Link to={`/courses/${course._id}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition">
        <div className="aspect-video bg-gray-100 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {course.category?.name ?? '전체'}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {levelLabel[course.level] ?? course.level}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500">{course.instructor}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {course.examName}
            </span>
            <span className="font-bold text-blue-600">무료</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
