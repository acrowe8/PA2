export type Teacher = {
  id: string;
  name: string;
  instruments: string[];
  availability: string[]; // ISO datetime strings for simplicity
};

export type Student = {
  id: string;
  name: string;
};

export type Booking = {
  id: string;
  teacherId: string;
  studentId: string;
  time: string; // ISO datetime
  mode: 'in_person' | 'virtual';
};

export const db = {
  teachers: new Map<string, Teacher>(),
  students: new Map<string, Student>(),
  bookings: new Map<string, Booking>(),
};
