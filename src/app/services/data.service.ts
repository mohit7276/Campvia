import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface QrSession {
  lectureId: string;
  subject: string;
  location: { lat: number; lng: number };
  sessionToken?: string;
}

export interface Course {
  id: string;
  name: string;
  head: string;
  duration: string;
  type: string;
  subjects: string[];
  totalFees: number;
  _id?: string;
  courseId?: string;
  // Landing page fields
  title?: string;
  category?: string;
  image?: string;
  description?: string;
  rating?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  courses = signal<Course[]>([]);

  private getAllowedFacultyCourseIds(): string[] | null {
    const user = this.auth.currentUser();
    if (!user || user.role !== 'faculty') return null;

    const fromArray = Array.isArray(user.courseIds)
      ? user.courseIds.map((id) => String(id || '').trim()).filter(Boolean)
      : [];
    if (fromArray.length > 0) return fromArray;

    const single = String(user.courseId || '').trim();
    if (single) return [single];

    // If session does not contain faculty course mappings yet,
    // defer to backend-scoped /admin/courses response instead of hiding all data.
    return null;
  }

  loadCourses() {
    this.api.getAdminCourses().subscribe({
      next: (data: any[]) => {
        const mapped = data.map(c => ({
          id: c.courseId || c._id,
          _id: c._id,
          courseId: c.courseId,
          name: c.name,
          head: c.head || '',
          duration: c.duration || '',
          type: c.type || 'Undergraduate',
          subjects: c.subjects || [],
          totalFees: c.totalFees || 0,
          // Landing page fields
          title: c.title || '',
          category: c.category || '',
          image: c.image || '',
          description: c.description || '',
          rating: c.rating || 0
        }));

        const allowedFacultyCourseIds = this.getAllowedFacultyCourseIds();
        if (allowedFacultyCourseIds !== null) {
          this.courses.set(mapped.filter(c => allowedFacultyCourseIds.includes(String(c.id || '').trim())));
          return;
        }

        this.courses.set(mapped);
      },
      error: () => {
        // No fallback — keep empty if API fails
        this.courses.set([]);
      }
    });
  }

  addCourse(course: Course) {
    const payload = {
      courseId: course.id,
      name: course.name,
      head: course.head,
      duration: course.duration,
      type: course.type,
      subjects: course.subjects,
      totalFees: course.totalFees,
      title: course.title || course.name,
      category: course.category || '',
      image: course.image || '',
      description: course.description || '',
      rating: course.rating || 0
    };
    this.api.createAdminCourse(payload).subscribe({
      next: (created: any) => {
        this.courses.update(c => [...c, {
          ...course,
          _id: created._id,
          title: created.title || course.name,
          category: created.category || '',
          image: created.image || '',
          description: created.description || '',
          rating: created.rating || 0
        }]);
      }
    });
  }

  updateCourse(updatedCourse: Course) {
    const mongoId = updatedCourse._id || updatedCourse.id;
    const payload = {
      courseId: updatedCourse.courseId || updatedCourse.id,
      name: updatedCourse.name,
      head: updatedCourse.head,
      duration: updatedCourse.duration,
      type: updatedCourse.type,
      subjects: updatedCourse.subjects,
      totalFees: updatedCourse.totalFees,
      title: updatedCourse.title || updatedCourse.name,
      category: updatedCourse.category || '',
      image: updatedCourse.image || '',
      description: updatedCourse.description || '',
      rating: updatedCourse.rating || 0
    };
    this.api.updateAdminCourse(mongoId, payload).subscribe({
      next: (updated: any) => {
        this.courses.update(c => c.map(course => course.id === updatedCourse.id ? {
          ...updatedCourse,
          title: updated.title || updatedCourse.name,
          category: updated.category || '',
          image: updated.image || '',
          description: updated.description || '',
          rating: updated.rating || 0
        } : course));
      }
    });
  }

  deleteCourse(courseId: string) {
    const course = this.courses().find(c => c.id === courseId);
    const mongoId = course?._id || courseId;
    this.api.deleteAdminCourse(mongoId).subscribe({
      next: () => {
        this.courses.update(c => c.filter(course => course.id !== courseId));
      }
    });
  }

  activeQrSession = signal<QrSession | null>(null);

  startQrSession(session: QrSession) {
    this.activeQrSession.set(session);
  }

  stopQrSession() {
    this.activeQrSession.set(null);
  }
}
