/**
 * Training & Certification Portal Service
 * Phase 8.3: Courses, Quizzes, Certifications
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface CreateCourseInput {
  code: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  isRequired?: boolean;
  requiredForRoles?: string[];
  requiredForTiers?: string[];
  prerequisiteCourseIds?: string[];
  durationMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  certificationValid?: number; // months
  thumbnailUrl?: string;
  createdBy?: string;
}

export interface CourseContentInput {
  title: string;
  contentType: 'video' | 'document' | 'slide' | 'scorm' | 'external_link';
  contentUrl?: string;
  contentBody?: string;
  moduleNumber?: number;
  lessonNumber?: number;
  sortOrder?: number;
  durationMinutes?: number;
  isRequired?: boolean;
  minWatchTime?: number;
}

export interface QuizInput {
  title: string;
  description?: string;
  quizType?: 'module' | 'final' | 'pre_assessment';
  timeLimitMinutes?: number;
  passingScore?: number;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  showCorrectAnswers?: boolean;
  questionsToShow?: number;
}

export interface QuizQuestionInput {
  questionType: 'multiple_choice' | 'true_false' | 'multi_select';
  question: string;
  explanation?: string;
  answers: Array<{ text: string; isCorrect: boolean; sortOrder?: number }>;
  points?: number;
  imageUrl?: string;
}

export interface QuizAttemptResult {
  quizId: string;
  score: number;
  passed: boolean;
  answers: Array<{ questionId: string; selectedAnswers: number[]; correct: boolean }>;
}

// ============================================================================
// COURSE MANAGEMENT
// ============================================================================

/**
 * Create a new training course
 */
export async function createCourse(input: CreateCourseInput) {
  return prisma.trainingCourse.create({
    data: {
      code: input.code,
      title: input.title,
      description: input.description,
      shortDescription: input.shortDescription,
      category: input.category,
      subcategory: input.subcategory,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      isRequired: input.isRequired || false,
      requiredForRoles: input.requiredForRoles ? JSON.stringify(input.requiredForRoles) : null,
      requiredForTiers: input.requiredForTiers ? JSON.stringify(input.requiredForTiers) : null,
      prerequisiteCourseIds: input.prerequisiteCourseIds
        ? JSON.stringify(input.prerequisiteCourseIds)
        : null,
      durationMinutes: input.durationMinutes || 0,
      passingScore: input.passingScore || 70,
      maxAttempts: input.maxAttempts || 3,
      certificationValid: input.certificationValid,
      thumbnailUrl: input.thumbnailUrl,
      createdBy: input.createdBy,
      status: 'draft',
    },
  });
}

/**
 * Get a course with all content
 */
export async function getCourse(idOrCode: string) {
  const course = await prisma.trainingCourse.findFirst({
    where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    include: {
      contents: { orderBy: [{ moduleNumber: 'asc' }, { lessonNumber: 'asc' }, { sortOrder: 'asc' }] },
      quizzes: {
        include: { questions: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { certifications: true, progress: true } },
    },
  });

  if (!course) return null;

  return {
    ...course,
    tags: course.tags ? JSON.parse(course.tags) : [],
    requiredForRoles: course.requiredForRoles ? JSON.parse(course.requiredForRoles) : [],
    requiredForTiers: course.requiredForTiers ? JSON.parse(course.requiredForTiers) : [],
    prerequisiteCourseIds: course.prerequisiteCourseIds
      ? JSON.parse(course.prerequisiteCourseIds)
      : [],
    quizzes: course.quizzes.map((q) => ({
      ...q,
      questions: q.questions.map((qu) => ({
        ...qu,
        answers: JSON.parse(qu.answers),
      })),
    })),
  };
}

/**
 * List courses with filtering
 */
export async function listCourses(options: {
  category?: string;
  status?: string;
  isRequired?: boolean;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { category, status, isRequired, search, page = 1, limit = 20 } = options;

  const where: Prisma.TrainingCourseWhereInput = {};
  if (category) where.category = category;
  if (status) where.status = status;
  if (isRequired !== undefined) where.isRequired = isRequired;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { code: { contains: search } },
    ];
  }

  const [courses, total] = await Promise.all([
    prisma.trainingCourse.findMany({
      where,
      include: {
        _count: { select: { contents: true, quizzes: true, certifications: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trainingCourse.count({ where }),
  ]);

  return {
    courses: courses.map((c) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Publish a course
 */
export async function publishCourse(id: string) {
  return prisma.trainingCourse.update({
    where: { id },
    data: { status: 'published', publishedAt: new Date() },
  });
}

/**
 * Archive a course
 */
export async function archiveCourse(id: string) {
  return prisma.trainingCourse.update({
    where: { id },
    data: { status: 'archived', archivedAt: new Date() },
  });
}

// ============================================================================
// COURSE CONTENT
// ============================================================================

/**
 * Add content to a course
 */
export async function addCourseContent(courseId: string, input: CourseContentInput) {
  // Get max sort order for the module/lesson
  const maxSort = await prisma.courseContent.aggregate({
    where: { courseId, moduleNumber: input.moduleNumber || 1 },
    _max: { sortOrder: true },
  });

  return prisma.courseContent.create({
    data: {
      courseId,
      title: input.title,
      contentType: input.contentType,
      contentUrl: input.contentUrl,
      contentBody: input.contentBody,
      moduleNumber: input.moduleNumber || 1,
      lessonNumber: input.lessonNumber || 1,
      sortOrder: input.sortOrder ?? (maxSort._max.sortOrder || 0) + 1,
      durationMinutes: input.durationMinutes || 0,
      isRequired: input.isRequired !== false,
      minWatchTime: input.minWatchTime,
    },
  });
}

/**
 * Update course content
 */
export async function updateCourseContent(contentId: string, input: Partial<CourseContentInput>) {
  return prisma.courseContent.update({
    where: { id: contentId },
    data: input,
  });
}

/**
 * Delete course content
 */
export async function deleteCourseContent(contentId: string) {
  return prisma.courseContent.delete({ where: { id: contentId } });
}

// ============================================================================
// QUIZ MANAGEMENT
// ============================================================================

/**
 * Create a quiz for a course
 */
export async function createQuiz(courseId: string, input: QuizInput) {
  const maxSort = await prisma.quiz.aggregate({
    where: { courseId },
    _max: { sortOrder: true },
  });

  return prisma.quiz.create({
    data: {
      courseId,
      title: input.title,
      description: input.description,
      quizType: input.quizType || 'final',
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore || 70,
      randomizeQuestions: input.randomizeQuestions !== false,
      randomizeAnswers: input.randomizeAnswers !== false,
      showCorrectAnswers: input.showCorrectAnswers !== false,
      questionsToShow: input.questionsToShow,
      sortOrder: (maxSort._max.sortOrder || 0) + 1,
    },
  });
}

/**
 * Add a question to a quiz
 */
export async function addQuizQuestion(quizId: string, input: QuizQuestionInput) {
  const maxSort = await prisma.quizQuestion.aggregate({
    where: { quizId },
    _max: { sortOrder: true },
  });

  return prisma.quizQuestion.create({
    data: {
      quizId,
      questionType: input.questionType,
      question: input.question,
      explanation: input.explanation,
      answers: JSON.stringify(input.answers),
      points: input.points || 1,
      imageUrl: input.imageUrl,
      sortOrder: (maxSort._max.sortOrder || 0) + 1,
    },
  });
}

/**
 * Update a quiz question
 */
export async function updateQuizQuestion(questionId: string, input: Partial<QuizQuestionInput>) {
  const data: Prisma.QuizQuestionUpdateInput = {};
  if (input.questionType) data.questionType = input.questionType;
  if (input.question) data.question = input.question;
  if (input.explanation !== undefined) data.explanation = input.explanation;
  if (input.answers) data.answers = JSON.stringify(input.answers);
  if (input.points) data.points = input.points;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;

  return prisma.quizQuestion.update({ where: { id: questionId }, data });
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Start or get course progress
 */
export async function startCourse(courseId: string, userId: string) {
  const existing = await prisma.courseProgress.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });

  if (existing) return existing;

  return prisma.courseProgress.create({
    data: {
      courseId,
      userId,
      status: 'in_progress',
      startedAt: new Date(),
    },
  });
}

/**
 * Update content progress
 */
export async function updateContentProgress(
  courseId: string,
  userId: string,
  contentId: string,
  timeSpent: number
) {
  const progress = await prisma.courseProgress.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });

  if (!progress) {
    throw new Error('Course not started');
  }

  const contentProgress = progress.contentProgress
    ? JSON.parse(progress.contentProgress)
    : {};

  contentProgress[contentId] = {
    viewed: true,
    viewedAt: new Date().toISOString(),
    timeSpent: (contentProgress[contentId]?.timeSpent || 0) + timeSpent,
  };

  // Calculate percent complete
  const course = await prisma.trainingCourse.findUnique({
    where: { id: courseId },
    include: { contents: { where: { isRequired: true } } },
  });

  const requiredContents = course?.contents.length || 1;
  const completedContents = Object.keys(contentProgress).filter(
    (id) => contentProgress[id].viewed
  ).length;

  const percentComplete = Math.round((completedContents / requiredContents) * 100);

  return prisma.courseProgress.update({
    where: { courseId_userId: { courseId, userId } },
    data: {
      contentProgress: JSON.stringify(contentProgress),
      percentComplete,
      totalTimeMinutes: { increment: Math.round(timeSpent / 60) },
      lastAccessedAt: new Date(),
    },
  });
}

/**
 * Submit quiz attempt and record results
 */
export async function submitQuizAttempt(
  courseId: string,
  userId: string,
  quizId: string,
  answers: Array<{ questionId: string; selectedAnswers: number[] }>
): Promise<QuizAttemptResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) throw new Error('Quiz not found');

  // Calculate score
  let totalPoints = 0;
  let earnedPoints = 0;
  const answerResults: QuizAttemptResult['answers'] = [];

  for (const question of quiz.questions) {
    const questionAnswers = JSON.parse(question.answers) as Array<{
      text: string;
      isCorrect: boolean;
    }>;
    const userAnswer = answers.find((a) => a.questionId === question.id);

    totalPoints += question.points;

    if (userAnswer) {
      const correctIndices = questionAnswers
        .map((a, i) => (a.isCorrect ? i : -1))
        .filter((i) => i >= 0);

      const isCorrect =
        correctIndices.length === userAnswer.selectedAnswers.length &&
        correctIndices.every((i) => userAnswer.selectedAnswers.includes(i));

      if (isCorrect) {
        earnedPoints += question.points;
      }

      answerResults.push({
        questionId: question.id,
        selectedAnswers: userAnswer.selectedAnswers,
        correct: isCorrect,
      });
    } else {
      answerResults.push({
        questionId: question.id,
        selectedAnswers: [],
        correct: false,
      });
    }
  }

  const score = Math.round((earnedPoints / totalPoints) * 100);
  const passed = score >= quiz.passingScore;

  // Update progress with quiz results
  const progress = await prisma.courseProgress.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });

  const quizResults = progress?.quizResults
    ? JSON.parse(progress.quizResults)
    : {};

  const attempts = (quizResults[quizId]?.attempts || 0) + 1;
  const bestScore = Math.max(quizResults[quizId]?.bestScore || 0, score);

  quizResults[quizId] = {
    attempts,
    bestScore,
    lastScore: score,
    lastAttemptAt: new Date().toISOString(),
    passedAt: passed && !quizResults[quizId]?.passedAt
      ? new Date().toISOString()
      : quizResults[quizId]?.passedAt,
  };

  await prisma.courseProgress.update({
    where: { courseId_userId: { courseId, userId } },
    data: {
      quizResults: JSON.stringify(quizResults),
      lastAccessedAt: new Date(),
    },
  });

  return {
    quizId,
    score,
    passed,
    answers: answerResults,
  };
}

/**
 * Complete a course and issue certification if applicable
 */
export async function completeCourse(courseId: string, userId: string) {
  const course = await prisma.trainingCourse.findUnique({ where: { id: courseId } });
  const progress = await prisma.courseProgress.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });

  if (!course || !progress) throw new Error('Course or progress not found');

  // Verify all requirements met
  if (progress.percentComplete < 100) {
    throw new Error('Course content not fully completed');
  }

  const quizResults = progress.quizResults ? JSON.parse(progress.quizResults) : {};
  const finalQuiz = await prisma.quiz.findFirst({
    where: { courseId, quizType: 'final' },
  });

  if (finalQuiz && !quizResults[finalQuiz.id]?.passedAt) {
    throw new Error('Final quiz not passed');
  }

  // Update progress
  await prisma.courseProgress.update({
    where: { courseId_userId: { courseId, userId } },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });

  // Issue certification if course has one
  if (course.certificationValid !== null) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.dealerId) throw new Error('User not associated with a dealer');

    const finalScore = finalQuiz ? quizResults[finalQuiz.id]?.bestScore || 0 : 100;
    const attemptNumber = finalQuiz ? quizResults[finalQuiz.id]?.attempts || 1 : 1;

    return issueCertification({
      courseId,
      userId,
      dealerId: user.dealerId,
      finalScore,
      attemptNumber,
      validMonths: course.certificationValid,
    });
  }

  return null;
}

// ============================================================================
// CERTIFICATION
// ============================================================================

/**
 * Generate certification number
 */
async function generateCertNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CERT-${year}-`;

  const lastCert = await prisma.certification.findFirst({
    where: { certificateNumber: { startsWith: prefix } },
    orderBy: { certificateNumber: 'desc' },
  });

  let sequence = 1;
  if (lastCert) {
    const lastSequence = parseInt(lastCert.certificateNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

/**
 * Issue a certification
 */
async function issueCertification(options: {
  courseId: string;
  userId: string;
  dealerId: string;
  finalScore: number;
  attemptNumber: number;
  validMonths: number;
}) {
  const certificateNumber = await generateCertNumber();
  const expiresAt = options.validMonths > 0
    ? new Date(Date.now() + options.validMonths * 30 * 24 * 60 * 60 * 1000)
    : null;

  return prisma.certification.create({
    data: {
      certificateNumber,
      courseId: options.courseId,
      userId: options.userId,
      dealerId: options.dealerId,
      finalScore: options.finalScore,
      attemptNumber: options.attemptNumber,
      status: 'active',
      issuedAt: new Date(),
      expiresAt,
    },
    include: {
      course: { select: { title: true, code: true } },
    },
  });
}

/**
 * Get user's certifications
 */
export async function getUserCertifications(userId: string) {
  return prisma.certification.findMany({
    where: { userId },
    include: {
      course: { select: { id: true, title: true, code: true, category: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });
}

/**
 * Get expiring certifications
 */
export async function getExpiringCertifications(daysAhead = 30, dealerId?: string) {
  const expiryDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  const where: Prisma.CertificationWhereInput = {
    status: 'active',
    expiresAt: { lte: expiryDate, gt: new Date() },
  };
  if (dealerId) where.dealerId = dealerId;

  return prisma.certification.findMany({
    where,
    include: {
      course: { select: { id: true, title: true, code: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      dealer: { select: { id: true, name: true, code: true } },
    },
    orderBy: { expiresAt: 'asc' },
  });
}

// ============================================================================
// TRAINING ASSIGNMENTS
// ============================================================================

/**
 * Assign training to a user
 */
export async function assignTraining(options: {
  courseId: string;
  userId: string;
  dealerId: string;
  assignedById?: string;
  dueDate?: Date;
  priority?: string;
}) {
  return prisma.trainingAssignment.create({
    data: {
      courseId: options.courseId,
      userId: options.userId,
      dealerId: options.dealerId,
      assignedById: options.assignedById,
      dueDate: options.dueDate,
      priority: options.priority || 'normal',
      status: 'assigned',
    },
    include: {
      course: { select: { id: true, title: true, code: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Get user's assignments
 */
export async function getUserAssignments(userId: string, status?: string) {
  const where: Prisma.TrainingAssignmentWhereInput = { userId };
  if (status) where.status = status;

  return prisma.trainingAssignment.findMany({
    where,
    include: {
      course: {
        select: { id: true, title: true, code: true, durationMinutes: true, thumbnailUrl: true },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

/**
 * Get overdue assignments
 */
export async function getOverdueAssignments(dealerId?: string) {
  const where: Prisma.TrainingAssignmentWhereInput = {
    status: { in: ['assigned', 'in_progress'] },
    dueDate: { lt: new Date() },
  };
  if (dealerId) where.dealerId = dealerId;

  return prisma.trainingAssignment.findMany({
    where,
    include: {
      course: { select: { id: true, title: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      dealer: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

// ============================================================================
// COMPLIANCE & REPORTING
// ============================================================================

/**
 * Get dealer compliance summary
 */
export async function getDealerComplianceSummary(dealerId: string) {
  // Get all users in the dealer
  const users = await prisma.user.findMany({
    where: { dealerId, status: 'active' },
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  // Get required courses for this dealer's tier
  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  const requiredCourses = await prisma.trainingCourse.findMany({
    where: {
      status: 'published',
      isRequired: true,
      OR: [
        { requiredForTiers: { contains: dealer?.tier || '' } },
        { requiredForTiers: null },
      ],
    },
    select: { id: true, title: true, code: true },
  });

  // Get certifications for all users
  const certifications = await prisma.certification.findMany({
    where: {
      dealerId,
      status: 'active',
    },
    select: { userId: true, courseId: true, expiresAt: true },
  });

  // Calculate compliance per user
  const compliance = users.map((user) => {
    const userCerts = certifications.filter((c) => c.userId === user.id);
    const completedRequired = requiredCourses.filter((course) =>
      userCerts.some((c) => c.courseId === course.id)
    ).length;

    return {
      user,
      completedRequired,
      totalRequired: requiredCourses.length,
      complianceRate: requiredCourses.length > 0
        ? Math.round((completedRequired / requiredCourses.length) * 100)
        : 100,
      expiringCount: userCerts.filter((c) =>
        c.expiresAt && c.expiresAt < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length,
    };
  });

  const avgCompliance = compliance.length > 0
    ? Math.round(compliance.reduce((sum, c) => sum + c.complianceRate, 0) / compliance.length)
    : 0;

  return {
    dealerId,
    dealerName: dealer?.name,
    totalUsers: users.length,
    requiredCourses: requiredCourses.length,
    avgComplianceRate: avgCompliance,
    fullyCompliant: compliance.filter((c) => c.complianceRate === 100).length,
    userCompliance: compliance,
    expiringIn30Days: compliance.reduce((sum, c) => sum + c.expiringCount, 0),
  };
}

/**
 * Get training analytics
 */
export async function getTrainingAnalytics() {
  const [
    totalCourses,
    publishedCourses,
    totalCertifications,
    activeCertifications,
    completionByCategory,
  ] = await Promise.all([
    prisma.trainingCourse.count(),
    prisma.trainingCourse.count({ where: { status: 'published' } }),
    prisma.certification.count(),
    prisma.certification.count({ where: { status: 'active' } }),
    prisma.trainingCourse.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
  ]);

  // Get completion rates
  const completionRates = await prisma.courseProgress.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return {
    courses: {
      total: totalCourses,
      published: publishedCourses,
    },
    certifications: {
      total: totalCertifications,
      active: activeCertifications,
    },
    completionByStatus: Object.fromEntries(
      completionRates.map((c) => [c.status, c._count.id])
    ),
    coursesByCategory: Object.fromEntries(
      completionByCategory.map((c) => [c.category, c._count.id])
    ),
  };
}
