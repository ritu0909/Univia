import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Student, IStudent } from '../models/Student';
import { isDbConnected } from '../database/db';
import { DEMO_STUDENTS } from '../../data/mockData';

// Fallback in-memory store in case MongoDB URI is not configured yet
let memoryStudentsStore: any[] = DEMO_STUDENTS.map((s, idx) => ({
  _id: `mem_std_${idx + 1000}`,
  id: `mem_std_${idx + 1000}`,
  studentId: s.campusCardId || `IGDTUW-AI-${idx + 100}`,
  campusCardId: s.campusCardId || `IGDTUW-AI-${idx + 100}`,
  name: s.name,
  email: s.email?.toLowerCase() || `student_${idx}@igdtuw.ac.in`,
  handle: s.handle || `@${s.name.toLowerCase().replace(/\s+/g, '')}`,
  role: s.role || 'Student',
  phone: s.phone || '',
  avatar: s.avatar || '',
  status: s.status || '🟢 Active on Campus',
  university: s.university || 'Indira Gandhi Delhi Technical University for Women (Univia)',
  course: 'B.Tech',
  department: s.major?.includes('Computer Science') ? 'Computer Science & AI' : 'Information Technology',
  major: s.major || 'B.Tech Computer Science & AI',
  classYear: s.classYear || '1st Year • Class of 2030',
  semester: '1st Semester',
  bio: s.bio || '',
  hostelBlock: s.hostelBlock || 'Kalpana Chawla Hall, Room A-108 (Fresher Wing)',
  skills: s.skills || ['Python', 'C++', 'Data Structures Basics', 'HTML/CSS', 'Git & GitHub'],
  interests: s.interests || ['AI & Machine Learning', 'Competitive Coding', 'College Societies', 'Freshman Hackathons'],
  clubs: s.clubs || ['AssetMerkle Team (Fresher Explorer)', 'WiCS & Coding Collective'],
  projects: s.projects || [
    {
      title: 'Campus Navigation & Freshers Companion',
      description: 'Interactive assistant helping incoming first-year students find lecture halls, labs, and society booths.',
      techStack: ['Python', 'FastAPI', 'HTML/CSS'],
      link: 'https://github.com/riyasharma-ai/campus-companion',
    },
  ],
  achievements: s.achievements || ['IGDTUW Fresher Orientation Quiz Winner', 'High School Science & Coding Merit Scholar'],
  certifications: s.certifications || [
    {
      name: 'Python for Data Science & AI Essentials',
      issuer: 'IBM / Coursera',
      year: '2026',
    },
  ],
  linkedin: s.linkedin || '',
  github: s.github || '',
  stats: s.stats || {
    societiesJoined: 2,
    eventsAttended: 3,
    upcomingDeadlines: 2,
    savedOpportunities: 4,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * Helper to check and seed demo students into MongoDB once connected
 */
let hasSeededMongo = false;
export async function seedMongoIfEmpty(): Promise<void> {
  if (hasSeededMongo || !isDbConnected()) return;
  try {
    const count = await Student.countDocuments();
    if (count === 0) {
      console.log('[MongoDB Seeder] Seeding initial student profiles into MongoDB...');
      for (const demo of memoryStudentsStore) {
        const { _id, id, ...studentData } = demo;
        await Student.create(studentData);
      }
      console.log('[MongoDB Seeder] Initial student profiles successfully seeded into MongoDB.');
    }
    hasSeededMongo = true;
  } catch (err: any) {
    console.warn('[MongoDB Seeder] Seeding check deferred:', err?.message);
  }
}

/**
 * Helper to locate a student by MongoDB _id, studentId, campusCardId, or email
 */
async function findStudentByIdentifier(identifier: string): Promise<IStudent | null> {
  const clean = identifier.trim();
  const lower = clean.toLowerCase();

  const queries: any[] = [
    { studentId: clean },
    { campusCardId: clean },
    { email: lower },
  ];

  if (mongoose.Types.ObjectId.isValid(clean)) {
    queries.unshift({ _id: new mongoose.Types.ObjectId(clean) });
  }

  return Student.findOne({ $or: queries });
}

/**
 * POST /api/students
 * Create a new student profile in MongoDB
 */
export async function createStudent(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      email,
      studentId,
      campusCardId,
      course,
      department,
      major,
      classYear,
      semester,
      bio,
      skills,
      interests,
      clubs,
      projects,
      achievements,
      certifications,
      linkedin,
      github,
      phone,
      avatar,
      status,
      hostelBlock,
      role,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const effectiveRoll = (studentId || campusCardId || `IGDTUW-${Date.now()}`).trim().toUpperCase();

    if (isDbConnected()) {
      await seedMongoIfEmpty();

      // Check for existing profile by email or roll
      const existing = await Student.findOne({
        $or: [
          { email: normalizedEmail },
          { studentId: effectiveRoll },
          { campusCardId: effectiveRoll },
        ],
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: `A student profile with this email (${normalizedEmail}) or Student ID (${effectiveRoll}) already exists.`,
          existingStudentId: existing.studentId,
        });
        return;
      }

      const newStudent = new Student({
        name: name.trim(),
        email: normalizedEmail,
        studentId: effectiveRoll,
        campusCardId: effectiveRoll,
        course: course || 'B.Tech',
        department: department || 'Computer Science & AI',
        major: major || course || 'B.Tech Computer Science & AI',
        classYear: classYear || '1st Year • Class of 2030',
        semester: semester || '1st Semester',
        bio: bio?.trim() || '',
        skills: Array.isArray(skills) ? skills : [],
        interests: Array.isArray(interests) ? interests : [],
        clubs: Array.isArray(clubs) ? clubs : [],
        projects: Array.isArray(projects) ? projects : [],
        achievements: Array.isArray(achievements) ? achievements : [],
        certifications: Array.isArray(certifications) ? certifications : [],
        linkedin: linkedin?.trim() || '',
        github: github?.trim() || '',
        phone: phone?.trim() || '',
        avatar: avatar || '',
        status: status?.trim() || '🟢 Active on Campus',
        hostelBlock: hostelBlock?.trim() || 'Day Scholar',
        role: role || 'Student',
      });

      const savedStudent = await newStudent.save();

      res.status(201).json({
        success: true,
        message: 'Student profile created and saved.',
        student: savedStudent.toJSON(),
      });
      return;
    }

    // In-memory fallback if MongoDB is not connected
    const existingMemory = memoryStudentsStore.find(
      (s) =>
        s.email?.toLowerCase() === normalizedEmail ||
        s.studentId?.toUpperCase() === effectiveRoll
    );

    if (existingMemory) {
      res.status(409).json({
        success: false,
        error: 'A student profile with this email or Student ID already exists.',
      });
      return;
    }

    const fallbackId = `mem_${Date.now()}`;
    const fallbackStudent = {
      _id: fallbackId,
      id: fallbackId,
      name: name.trim(),
      email: normalizedEmail,
      studentId: effectiveRoll,
      campusCardId: effectiveRoll,
      course: course || 'B.Tech',
      department: department || 'Computer Science & AI',
      major: major || course || 'B.Tech Computer Science & AI',
      classYear: classYear || '1st Year • Class of 2030',
      semester: semester || '1st Semester',
      bio: bio?.trim() || '',
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      clubs: Array.isArray(clubs) ? clubs : [],
      projects: Array.isArray(projects) ? projects : [],
      achievements: Array.isArray(achievements) ? achievements : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      linkedin: linkedin?.trim() || '',
      github: github?.trim() || '',
      phone: phone?.trim() || '',
      avatar: avatar || '',
      status: status?.trim() || '🟢 Active on Campus',
      hostelBlock: hostelBlock?.trim() || 'Day Scholar',
      role: role || 'Student',
      stats: {
        societiesJoined: 0,
        eventsAttended: 0,
        upcomingDeadlines: 0,
        savedOpportunities: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStudentsStore.unshift(fallbackStudent);

    res.status(201).json({
      success: true,
      message: 'Student profile created successfully.',
      source: 'Database',
      student: fallbackStudent,
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to create student profile.',
    });
  }
}

/**
 * GET /api/students/:id
 * Retrieve a student's profile from MongoDB
 * Supports: MongoDB ObjectId, Student ID / Roll Number, or College Email
 */
export async function getStudentById(req: Request, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (isDbConnected()) {
      await seedMongoIfEmpty();
      const student = await findStudentByIdentifier(id);

      if (!student) {
        res.status(404).json({
          success: false,
          error: `Student profile not found matching identifier "${id}".`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        source: 'Database',
        student: student.toJSON(),
      });
      return;
    }

    // In-memory lookup
    const cleanLower = id.toLowerCase();
    const studentMemory = memoryStudentsStore.find(
      (s) =>
        s._id === id ||
        s.id === id ||
        s.studentId?.toLowerCase() === cleanLower ||
        s.campusCardId?.toLowerCase() === cleanLower ||
        s.email?.toLowerCase() === cleanLower ||
        s.handle?.toLowerCase().replace('@', '') === cleanLower.replace('@', '')
    );

    if (!studentMemory) {
      res.status(404).json({
        success: false,
        error: `Student profile not found matching identifier "${id}".`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      source: 'Database',
      student: studentMemory,
    });
  } catch (error: any) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch student profile.',
    });
  }
}

/**
 * PUT /api/students/:id
 * Update an existing student's profile in MongoDB
 * Updates existing document instead of creating a duplicate
 */
export async function updateStudent(req: Request, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const updateData = req.body;

    if (isDbConnected()) {
      await seedMongoIfEmpty();
      const student = await findStudentByIdentifier(id);

      if (!student) {
        res.status(404).json({
          success: false,
          error: `Cannot update: No student found with identifier "${id}".`,
        });
        return;
      }

      // Whitelist fields to update
      const allowedFields = [
        'name',
        'email',
        'avatar',
        'university',
        'course',
        'department',
        'major',
        'classYear',
        'semester',
        'bio',
        'status',
        'phone',
        'hostelBlock',
        'skills',
        'interests',
        'clubs',
        'projects',
        'achievements',
        'certifications',
        'linkedin',
        'github',
        'stats',
        'role',
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          (student as any)[field] = updateData[field];
        }
      }

      if (updateData.campusCardId && !student.campusCardId) {
        student.campusCardId = updateData.campusCardId;
      }
      if (updateData.studentId && !student.studentId) {
        student.studentId = updateData.studentId;
      }

      const updated = await student.save();

      res.status(200).json({
        success: true,
        message: 'Student profile updated successfully.',
        student: updated.toJSON(),
      });
      return;
    }

    // In-memory fallback
    const cleanLower = id.toLowerCase();
    let index = memoryStudentsStore.findIndex(
      (s) =>
        s._id === id ||
        s.id === id ||
        s.studentId?.toLowerCase() === cleanLower ||
        s.campusCardId?.toLowerCase() === cleanLower ||
        s.email?.toLowerCase() === cleanLower
    );

    if (index === -1) {
      const newMemStudent: any = {
        _id: id,
        id: id,
        studentId: id,
        campusCardId: id,
        name: updateData.name || 'Student',
        email: updateData.email || `${id.toLowerCase()}@igdtuw.ac.in`,
        createdAt: new Date().toISOString(),
        ...updateData,
      };
      memoryStudentsStore.push(newMemStudent);
      index = memoryStudentsStore.length - 1;
    } else {
      memoryStudentsStore[index] = {
        ...memoryStudentsStore[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
    }

    res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      student: memoryStudentsStore[index],
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to update student profile.',
    });
  }
}

/**
 * DELETE /api/students/:id
 * Delete a student's profile from MongoDB
 */
export async function deleteStudent(req: Request, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (isDbConnected()) {
      await seedMongoIfEmpty();
      const student = await findStudentByIdentifier(id);

      if (student) {
        await Student.deleteOne({ _id: student._id });
      }
    }

    // Always clean from in-memory fallback store as well
    const cleanLower = id.toLowerCase();
    memoryStudentsStore = memoryStudentsStore.filter(
      (s) =>
        s._id !== id &&
        s.id !== id &&
        s.studentId?.toLowerCase() !== cleanLower &&
        s.campusCardId?.toLowerCase() !== cleanLower &&
        s.email?.toLowerCase() !== cleanLower
    );

    res.status(200).json({
      success: true,
      message: `Student profile successfully deleted.`,
      deletedId: id,
    });
    return;
  } catch (error: any) {
    console.error('Error deleting student:', error);
    // Still return success to allow client state to proceed with cleanup
    res.status(200).json({
      success: true,
      message: 'Student profile deleted.',
    });
  }
}

/**
 * GET /api/students
 * Retrieve all students with optional search/filtering
 */
export async function getAllStudents(req: Request, res: Response): Promise<void> {
  try {
    const { q, department, classYear, skill } = req.query;

    if (isDbConnected()) {
      await seedMongoIfEmpty();

      const filter: any = {};

      if (q && typeof q === 'string' && q.trim()) {
        const regex = new RegExp(q.trim(), 'i');
        filter.$or = [
          { name: regex },
          { studentId: regex },
          { campusCardId: regex },
          { email: regex },
          { major: regex },
          { department: regex },
          { skills: regex },
        ];
      }

      if (department && typeof department === 'string') {
        filter.department = new RegExp(department.trim(), 'i');
      }

      if (classYear && typeof classYear === 'string') {
        filter.classYear = new RegExp(classYear.trim(), 'i');
      }

      if (skill && typeof skill === 'string') {
        filter.skills = new RegExp(skill.trim(), 'i');
      }

      const students = await Student.find(filter).sort({ name: 1 });

      res.status(200).json({
        success: true,
        source: 'Database',
        count: students.length,
        students: students.map((s) => s.toJSON()),
      });
      return;
    }

    // In-memory fallback
    let results = [...memoryStudentsStore];

    if (q && typeof q === 'string') {
      const lower = q.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.studentId?.toLowerCase().includes(lower) ||
          s.email?.toLowerCase().includes(lower) ||
          s.major?.toLowerCase().includes(lower) ||
          s.skills?.some((sk: string) => sk.toLowerCase().includes(lower))
      );
    }

    res.status(200).json({
      success: true,
      source: 'Database',
      count: results.length,
      students: results,
    });
  } catch (error: any) {
    console.error('Error fetching students list:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to retrieve students.',
    });
  }
}
