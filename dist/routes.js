import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './data.js';
export const router = Router();
// Teachers
router.post('/teachers', (req, res) => {
    const { name, instruments, availability } = req.body;
    if (!name || !Array.isArray(instruments) || !Array.isArray(availability)) {
        return res.status(400).json({ error: 'Invalid teacher payload' });
    }
    const id = randomUUID();
    const teacher = { id, name, instruments, availability };
    db.teachers.set(id, teacher);
    res.status(201).json(teacher);
});
router.get('/teachers', (_req, res) => {
    res.json(Array.from(db.teachers.values()));
});
// Students
router.post('/students', (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Invalid student payload' });
    const id = randomUUID();
    const student = { id, name };
    db.students.set(id, student);
    res.status(201).json(student);
});
router.get('/students', (_req, res) => {
    res.json(Array.from(db.students.values()));
});
// Bookings
router.post('/bookings', (req, res) => {
    const { teacherId, studentId, time, mode } = req.body;
    if (!teacherId || !studentId || !time || (mode !== 'in_person' && mode !== 'virtual')) {
        return res.status(400).json({ error: 'Invalid booking payload' });
    }
    if (!db.teachers.has(teacherId))
        return res.status(404).json({ error: 'Teacher not found' });
    if (!db.students.has(studentId))
        return res.status(404).json({ error: 'Student not found' });
    const id = randomUUID();
    const booking = { id, teacherId, studentId, time, mode };
    db.bookings.set(id, booking);
    res.status(201).json(booking);
});
router.get('/bookings', (_req, res) => {
    res.json(Array.from(db.bookings.values()));
});
// Admin Reports
router.get('/admin/reports/bookings', (_req, res) => {
    const report = Array.from(db.bookings.values()).map(b => ({
        id: b.id,
        teacher: db.teachers.get(b.teacherId)?.name ?? 'Unknown',
        student: db.students.get(b.studentId)?.name ?? 'Unknown',
        time: b.time,
        mode: b.mode,
    }));
    res.json({ count: report.length, bookings: report });
});
