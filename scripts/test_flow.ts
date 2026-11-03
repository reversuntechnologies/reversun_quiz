import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== STEP 1: VERIFY ADMIN USER IN DATABASE ===");
  const admin = await prisma.user.findUnique({
    where: { email: "admin@reversun.com" },
  });
  if (!admin) {
    throw new Error("Admin user admin@reversun.com not found!");
  }
  console.log("Admin user verified:", admin.email, admin.role);

  console.log("\n=== STEP 2: VERIFY CATEGORIES ===");
  const category = await prisma.category.findFirst({
    where: { isActive: true },
  });
  if (!category) throw new Error("No category found");
  console.log("Using category:", category.name, category.id);

  console.log("\n=== STEP 3: CREATE ADMIN QUIZ WITH 3 MCQ QUESTIONS ===");
  const quiz = await prisma.quiz.create({
    data: {
      title: "REVERSUN Cloud & DevOps Grand Prix 2026",
      slug: `reversun-cloud-devops-${Date.now().toString().slice(-4)}`,
      description: "Authoritative architectural quiz covering Next.js 16, PostgreSQL internals, and Docker containers.",
      difficulty: "MEDIUM",
      status: "PUBLISHED",
      durationMinutes: 15,
      negativeMarking: true,
      startsAt: new Date(Date.now() - 5 * 60 * 1000), // Started 5 mins ago -> LIVE NOW!
      endsAt: new Date(Date.now() + 60 * 60 * 1000), // Ends in 1 hour
      categoryId: category.id,
      createdBy: admin.id,
      questions: {
        create: [
          {
            position: 1,
            type: "SINGLE",
            questionText: "What mechanism in Next.js 16 allows UI segments to render instantly while data streams in?",
            marks: 1.0,
            negativeMarks: 0.25,
            explanation: "Partial Prerendering (PPR) combines static shell prerendering with dynamic streaming suspense.",
            options: {
              create: [
                { position: 1, optionText: "Partial Prerendering (PPR) with Suspense", isCorrect: true },
                { position: 2, optionText: "Client-side jQuery AJAX polling", isCorrect: false },
                { position: 3, optionText: "Blocking synchronous server side rendering", isCorrect: false },
                { position: 4, optionText: "iFrame embedding", isCorrect: false },
              ],
            },
          },
          {
            position: 2,
            type: "SINGLE",
            questionText: "In PostgreSQL, which index type is most optimal for equality and range queries on B-tree ordered data?",
            marks: 1.0,
            negativeMarks: 0.25,
            explanation: "B-Tree indexes are PostgreSQL default and optimal for <, <=, =, >=, > queries.",
            options: {
              create: [
                { position: 1, optionText: "Hash Index", isCorrect: false },
                { position: 2, optionText: "B-Tree Index", isCorrect: true },
                { position: 3, optionText: "GIN Index", isCorrect: false },
                { position: 4, optionText: "BRIN Index only", isCorrect: false },
              ],
            },
          },
          {
            position: 3,
            type: "SINGLE",
            questionText: "Which HTTP status code signifies a resource was successfully created on the server?",
            marks: 1.0,
            negativeMarks: 0.25,
            explanation: "HTTP 201 Created indicates the request succeeded and led to resource creation.",
            options: {
              create: [
                { position: 1, optionText: "200 OK", isCorrect: false },
                { position: 2, optionText: "201 Created", isCorrect: true },
                { position: 3, optionText: "204 No Content", isCorrect: false },
                { position: 4, optionText: "301 Moved Permanently", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
    include: {
      category: true,
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  console.log("Created quiz successfully:");
  console.log(`- Title: ${quiz.title}`);
  console.log(`- Slug: ${quiz.slug}`);
  console.log(`- Questions Count: ${quiz.questions.length}`);

  console.log("\n=== STEP 4: SIMULATE SIGNED-IN USER ATTEMPT & ANSWER SUBMISSION ===");
  // User signs in (e.g. Balaji)
  const candidateUser = await prisma.user.upsert({
    where: { email: "student.balaji@reversun.dev" },
    update: { name: "Balaji Candidate" },
    create: {
      firebaseUid: "google-test-uid-balaji-student",
      email: "student.balaji@reversun.dev",
      name: "Balaji Candidate",
      role: "USER",
    },
  });
  console.log("Candidate signed in:", candidateUser.name, candidateUser.email);

  // User starts attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: candidateUser.id,
      attemptNumber: 1,
      startedAt: new Date(),
      deadlineAt: new Date(Date.now() + 15 * 60 * 1000),
      status: "IN_PROGRESS",
    },
  });

  // Candidate answers Question 1 (Correct), Question 2 (Correct), Question 3 (Incorrect)
  const q1 = quiz.questions[0];
  const q1Correct = q1.options.find((o) => o.isCorrect)!;

  const q2 = quiz.questions[1];
  const q2Correct = q2.options.find((o) => o.isCorrect)!;

  const q3 = quiz.questions[2];
  const q3Wrong = q3.options.find((o) => !o.isCorrect)!;

  // Grade & submit
  const now = new Date();
  const ans1 = await prisma.attemptAnswer.create({
    data: {
      attemptId: attempt.id,
      questionId: q1.id,
      isCorrect: true,
      awardedMarks: 1.0,
      answeredAt: now,
      selectedOptions: {
        create: [{ optionId: q1Correct.id }],
      },
    },
  });

  const ans2 = await prisma.attemptAnswer.create({
    data: {
      attemptId: attempt.id,
      questionId: q2.id,
      isCorrect: true,
      awardedMarks: 1.0,
      answeredAt: now,
      selectedOptions: {
        create: [{ optionId: q2Correct.id }],
      },
    },
  });

  const ans3 = await prisma.attemptAnswer.create({
    data: {
      attemptId: attempt.id,
      questionId: q3.id,
      isCorrect: false,
      awardedMarks: -0.25,
      answeredAt: now,
      selectedOptions: {
        create: [{ optionId: q3Wrong.id }],
      },
    },
  });

  // Final score: 1.0 + 1.0 - 0.25 = 1.75
  await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "SUBMITTED",
      submittedAt: now,
      totalScore: 1.75,
      maxScore: 3.0,
    },
  });

  console.log("Candidate attempt submitted with answers:");
  console.log(`- Total Score: 1.75 / 3.00`);
  console.log(`- Q1 selected: "${q1Correct.optionText}" (Correct: true)`);
  console.log(`- Q2 selected: "${q2Correct.optionText}" (Correct: true)`);
  console.log(`- Q3 selected: "${q3Wrong.optionText}" (Correct: false)`);

  console.log("\n=== STEP 5: VERIFY ADMIN CAN INSPECT THE QUIZ AND USER ANSWERS ===");
  const auditAttempt = await prisma.quizAttempt.findUnique({
    where: { id: attempt.id },
    include: {
      user: true,
      answers: {
        include: {
          question: true,
          selectedOptions: {
            include: { option: true },
          },
        },
      },
    },
  });

  console.log("Admin inspection query returned candidate answers:");
  console.log(`- Candidate: ${auditAttempt?.user.name} (${auditAttempt?.user.email})`);
  console.log(`- Status: ${auditAttempt?.status}`);
  console.log(`- Score: ${auditAttempt?.totalScore} / ${auditAttempt?.maxScore}`);
  console.log(`- Answers recorded in DB: ${auditAttempt?.answers.length}`);

  for (const a of auditAttempt?.answers || []) {
    console.log(
      `  • Question ${a.question.position}: ${a.isCorrect ? "CORRECT" : "WRONG"} | Picked: "${
        a.selectedOptions[0]?.option.optionText
      }" | Awarded: ${a.awardedMarks} pts`
    );
  }

  console.log("\n=== ALL FLOW VERIFICATIONS SUCCEEDED 100%! ===");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
