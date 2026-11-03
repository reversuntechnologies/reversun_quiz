import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

async function main() {
  console.log("🌱 Starting database seeding on Neon PostgreSQL...");

  // 1. Create Super Admin User
  const adminPasswordHash = hashPassword("admin@12345");
  const admin = await prisma.user.upsert({
    where: { email: "admin@reversun.com" },
    update: {
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      firebaseUid: "admin_reversun_default_uid",
      email: "admin@reversun.com",
      name: "REVERSUN Administrator",
      displayName: "ReversunAdmin",
      role: "SUPER_ADMIN",
      isActive: true,
      passwordHash: adminPasswordHash,
      bio: "Official administrator of REVERSUN Quizzes and Hackathons.",
    },
  });
  console.log(`✅ Admin user ready: ${admin.email} (${admin.id})`);

  // 2. Create Participant Users
  const participants = [
    {
      firebaseUid: "uid_arun_kumar_2026",
      email: "arun.kumar@example.com",
      name: "Arun Kumar",
      displayName: "ArunK",
      bio: "Full Stack Engineer & Cloud Enthusiast.",
    },
    {
      firebaseUid: "uid_priya_sharma_2026",
      email: "priya.sharma@example.com",
      name: "Priya Sharma",
      displayName: "PriyaDev",
      bio: "AI Systems Researcher and Competitive Programmer.",
    },
    {
      firebaseUid: "uid_karthik_rajan_2026",
      email: "karthik.rajan@example.com",
      name: "Karthik Rajan",
      displayName: "KarthikR",
      bio: "DevOps Architect & Database Tuning Specialist.",
    },
    {
      firebaseUid: "uid_divya_nair_2026",
      email: "divya.nair@example.com",
      name: "Divya Nair",
      displayName: "DivyaN",
      bio: "Frontend Developer loving Next.js & React 19.",
    },
  ];

  const createdUsers: Record<string, string> = { admin: admin.id };

  for (const p of participants) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        firebaseUid: p.firebaseUid,
        email: p.email,
        name: p.name,
        displayName: p.displayName,
        role: "USER",
        isActive: true,
        bio: p.bio,
      },
    });
    createdUsers[p.displayName] = user.id;
  }
  console.log(`✅ Sample participants created.`);

  // 3. Create Categories
  const categoriesData = [
    { name: "Artificial Intelligence & ML", slug: "ai-and-ml" },
    { name: "Full-Stack Software Engineering", slug: "software-engineering" },
    { name: "Cloud, DevOps & Security", slug: "cloud-and-security" },
    { name: "Database Systems & Internals", slug: "database-systems" },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug, isActive: true },
    });
    createdCategories[cat.slug] = created.id;
  }
  console.log(`✅ Categories created.`);

  const now = new Date();

  // 4. Create a LIVE Quiz (starts 1 hour ago, ends in 4 hours)
  const liveQuizStarts = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const liveQuizEnds = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const liveQuiz = await prisma.quiz.upsert({
    where: { slug: "nextjs-system-design-sprint-2026" },
    update: {
      status: "PUBLISHED",
      startsAt: liveQuizStarts,
      endsAt: liveQuizEnds,
    },
    create: {
      title: "Next.js 16 & Modern System Design Sprint",
      slug: "nextjs-system-design-sprint-2026",
      description:
        "Test your real-world skills on Next.js 16 Turbopack, React 19 Server Components, Caching, and High-Throughput Scalability. Win cash prizes and direct certificates!",
      difficulty: "MEDIUM",
      status: "PUBLISHED",
      startsAt: liveQuizStarts,
      endsAt: liveQuizEnds,
      durationMinutes: 20,
      maxAttempts: 1,
      negativeMarking: true,
      certificatesEnabled: true,
      categoryId: createdCategories["software-engineering"],
      createdBy: admin.id,
      prizes: {
        create: [
          {
            position: 1,
            title: "1st Prize",
            description: "₹5,000 Cash + Certificate of Excellence",
            rewardType: "CASH",
            rewardValue: 5000,
            rewardCurrency: "INR",
          },
          {
            position: 2,
            title: "2nd Prize",
            description: "₹3,000 Cash + Silver Certificate",
            rewardType: "CASH",
            rewardValue: 3000,
            rewardCurrency: "INR",
          },
          {
            position: 3,
            title: "3rd Prize",
            description: "₹1,500 Cash + Bronze Certificate",
            rewardType: "CASH",
            rewardValue: 1500,
            rewardCurrency: "INR",
          },
        ],
      },
      questions: {
        create: [
          {
            position: 1,
            questionText:
              "In Next.js App Router with Server Components, what is the default rendering behavior of child components unless marked with 'use client'?",
            type: "SINGLE",
            marks: 4,
            negativeMarks: 1,
            explanation:
              "By default, all components inside the app directory are React Server Components unless explicitly marked with 'use client'.",
            options: {
              create: [
                { optionText: "They render strictly on the server without shipping client JavaScript.", isCorrect: true, position: 1 },
                { optionText: "They render as Client Components automatically.", isCorrect: false, position: 2 },
                { optionText: "They throw a runtime compilation error.", isCorrect: false, position: 3 },
                { optionText: "They are cached only in browser localStorage.", isCorrect: false, position: 4 },
              ],
            },
          },
          {
            position: 2,
            questionText:
              "Which HTTP caching header or Next.js API primitive is used to achieve Incremental Static Regeneration (ISR) at the route handler or fetch level?",
            type: "SINGLE",
            marks: 4,
            negativeMarks: 1,
            explanation:
              "In Next.js, `fetch(url, { next: { revalidate: seconds } })` enables time-based background cache revalidation.",
            options: {
              create: [
                { optionText: "next: { revalidate: seconds }", isCorrect: true, position: 1 },
                { optionText: "cache: 'force-static'", isCorrect: false, position: 2 },
                { optionText: "export const dynamic = 'revalidate'", isCorrect: false, position: 3 },
                { optionText: "headers: { 'X-Cache-Revalidate': 'true' }", isCorrect: false, position: 4 },
              ],
            },
          },
          {
            position: 3,
            questionText:
              "When configuring Neon Serverless PostgreSQL with Prisma ORM in connection pooling mode, why is `@prisma/adapter-pg` or a direct URL recommended for migrations?",
            type: "SINGLE",
            marks: 4,
            negativeMarks: 1,
            explanation:
              "Transaction connection pooling (via PgBouncer) cannot hold long-lived advisory locks or prepared statements required during DDL schema alterations.",
            options: {
              create: [
                { optionText: "PgBouncer poolers do not support DDL commands requiring session-level locks or prepared statements.", isCorrect: true, position: 1 },
                { optionText: "Neon deletes tables during pooled connections.", isCorrect: false, position: 2 },
                { optionText: "PostgreSQL only accepts SSL certificates on direct ports.", isCorrect: false, position: 3 },
                { optionText: "Prisma requires WebSocket emulation for DDL.", isCorrect: false, position: 4 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅ Live Quiz created: ${liveQuiz.title}`);

  // 5. Create an UPCOMING Quiz (starts in 24 hours)
  const upcomingStarts = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingEnds = new Date(now.getTime() + 27 * 60 * 60 * 1000);

  const upcomingQuiz = await prisma.quiz.upsert({
    where: { slug: "ai-agents-llm-engineering-challenge-2026" },
    update: {
      status: "PUBLISHED",
      startsAt: upcomingStarts,
      endsAt: upcomingEnds,
    },
    create: {
      title: "AI Agents & Autonomous Systems Architecture Challenge",
      slug: "ai-agents-llm-engineering-challenge-2026",
      description:
        "Compete against top AI builders on MCP protocol, multi-agent coordination, tool-use grounding, and LLM evaluation benchmarks.",
      difficulty: "HARD",
      status: "PUBLISHED",
      startsAt: upcomingStarts,
      endsAt: upcomingEnds,
      durationMinutes: 30,
      maxAttempts: 1,
      negativeMarking: true,
      certificatesEnabled: true,
      categoryId: createdCategories["ai-and-ml"],
      createdBy: admin.id,
      prizes: {
        create: [
          {
            position: 1,
            title: "Grand Champion",
            description: "₹10,000 Cash Prize + REVERSUN AI Fellow Trophy",
            rewardType: "CASH",
            rewardValue: 10000,
            rewardCurrency: "INR",
          },
          {
            position: 2,
            title: "First Runner-Up",
            description: "₹5,000 Cash Prize + Certificate of Excellence",
            rewardType: "CASH",
            rewardValue: 5000,
            rewardCurrency: "INR",
          },
        ],
      },
    },
  });
  console.log(`✅ Upcoming Quiz created: ${upcomingQuiz.title}`);

  // 6. Create a COMPLETED PAST Quiz with real Results & Certificate
  const pastStarts = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const pastEnds = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const pastQuiz = await prisma.quiz.upsert({
    where: { slug: "postgresql-internals-championship-2026" },
    update: {
      status: "PUBLISHED",
      startsAt: pastStarts,
      endsAt: pastEnds,
    },
    create: {
      title: "PostgreSQL Database Internals & Indexing Championship",
      slug: "postgresql-internals-championship-2026",
      description:
        "Deep dive into MVCC, WAL logs, B-Tree vs BRIN indexes, query planner optimization, and vacuuming internals.",
      difficulty: "HARD",
      status: "PUBLISHED",
      startsAt: pastStarts,
      endsAt: pastEnds,
      durationMinutes: 25,
      maxAttempts: 1,
      negativeMarking: true,
      certificatesEnabled: true,
      categoryId: createdCategories["database-systems"],
      createdBy: admin.id,
      prizes: {
        create: [
          {
            position: 1,
            title: "Winner",
            description: "₹5,000 Cash Prize",
            rewardType: "CASH",
            rewardValue: 5000,
            rewardCurrency: "INR",
          },
        ],
      },
    },
  });
  console.log(`✅ Past Quiz created: ${pastQuiz.title}`);

  // 7. Seed completed attempts, results, points and certificate for the past quiz
  const arunId = createdUsers["ArunK"];
  const priyaId = createdUsers["PriyaDev"];
  const karthikId = createdUsers["KarthikR"];

  if (arunId && priyaId && karthikId) {
    // Attempt 1: Arun (Rank 1)
    const arunAttempt = await prisma.quizAttempt.upsert({
      where: {
        quizId_userId_attemptNumber: {
          quizId: pastQuiz.id,
          userId: arunId,
          attemptNumber: 1,
        },
      },
      update: {},
      create: {
        quizId: pastQuiz.id,
        userId: arunId,
        attemptNumber: 1,
        status: "SUBMITTED",
        startedAt: pastStarts,
        deadlineAt: new Date(pastStarts.getTime() + 25 * 60 * 1000),
        submittedAt: new Date(pastStarts.getTime() + 18 * 60 * 1000),
        totalScore: 92.5,
        maxScore: 100,
      },
    });

    await prisma.quizResult.upsert({
      where: {
        quizId_userId: { quizId: pastQuiz.id, userId: arunId },
      },
      update: {},
      create: {
        quizId: pastQuiz.id,
        userId: arunId,
        attemptId: arunAttempt.id,
        score: 92.5,
        rank: 1,
        position: 1,
        completionTimeMs: BigInt(18 * 60 * 1000),
        isWinner: true,
      },
    });

    // Points for Arun
    await prisma.pointTransaction.upsert({
      where: {
        userId_source_sourceReference: {
          userId: arunId,
          source: "QUIZ_WINNER",
          sourceReference: pastQuiz.id,
        },
      },
      update: {},
      create: {
        userId: arunId,
        quizId: pastQuiz.id,
        source: "QUIZ_WINNER",
        sourceReference: pastQuiz.id,
        points: 250,
        description: "1st Place in PostgreSQL Database Internals Championship",
      },
    });

    // Verifiable Digital Certificate for Arun
    await prisma.certificate.upsert({
      where: { certificateNumber: "REV-2026-CERT-0001" },
      update: {},
      create: {
        certificateNumber: "REV-2026-CERT-0001",
        verificationToken: "c7e2a9b1-4f8d-4e92-bc10-72e9a65d109f",
        userId: arunId,
        quizId: pastQuiz.id,
        type: "WINNER",
        position: 1,
        score: 92.5,
        pdfUrl: "/certificates/sample-arun-cert.pdf",
        issuedAt: new Date(pastEnds.getTime() + 10 * 60 * 1000),
      },
    });

    // Attempt 2: Priya (Rank 2)
    const priyaAttempt = await prisma.quizAttempt.upsert({
      where: {
        quizId_userId_attemptNumber: {
          quizId: pastQuiz.id,
          userId: priyaId,
          attemptNumber: 1,
        },
      },
      update: {},
      create: {
        quizId: pastQuiz.id,
        userId: priyaId,
        attemptNumber: 1,
        status: "SUBMITTED",
        startedAt: pastStarts,
        deadlineAt: new Date(pastStarts.getTime() + 25 * 60 * 1000),
        submittedAt: new Date(pastStarts.getTime() + 21 * 60 * 1000),
        totalScore: 88.0,
        maxScore: 100,
      },
    });

    await prisma.quizResult.upsert({
      where: {
        quizId_userId: { quizId: pastQuiz.id, userId: priyaId },
      },
      update: {},
      create: {
        quizId: pastQuiz.id,
        userId: priyaId,
        attemptId: priyaAttempt.id,
        score: 88.0,
        rank: 2,
        position: 2,
        completionTimeMs: BigInt(21 * 60 * 1000),
        isWinner: false,
      },
    });

    await prisma.pointTransaction.upsert({
      where: {
        userId_source_sourceReference: {
          userId: priyaId,
          source: "QUIZ_RANK_2",
          sourceReference: pastQuiz.id,
        },
      },
      update: {},
      create: {
        userId: priyaId,
        quizId: pastQuiz.id,
        source: "QUIZ_RANK_2",
        sourceReference: pastQuiz.id,
        points: 175,
        description: "2nd Place in PostgreSQL Database Internals Championship",
      },
    });

    // Attempt 3: Karthik (Rank 3)
    const karthikAttempt = await prisma.quizAttempt.upsert({
      where: {
        quizId_userId_attemptNumber: {
          quizId: pastQuiz.id,
          userId: karthikId,
          attemptNumber: 1,
        },
      },
      update: {},
      create: {
        quizId: pastQuiz.id,
        userId: karthikId,
        attemptNumber: 1,
        status: "SUBMITTED",
        startedAt: pastStarts,
        deadlineAt: new Date(pastStarts.getTime() + 25 * 60 * 1000),
        submittedAt: new Date(pastStarts.getTime() + 24 * 60 * 1000),
        totalScore: 81.0,
        maxScore: 100,
      },
    });

    await prisma.quizResult.upsert({
      where: {
        quizId_userId: { quizId: pastQuiz.id, userId: karthikId },
      },
      update: {},
      create: {
        quizId: pastQuiz.id,
        userId: karthikId,
        attemptId: karthikAttempt.id,
        score: 81.0,
        rank: 3,
        position: 3,
        completionTimeMs: BigInt(24 * 60 * 1000),
        isWinner: false,
      },
    });

    await prisma.pointTransaction.upsert({
      where: {
        userId_source_sourceReference: {
          userId: karthikId,
          source: "QUIZ_RANK_3",
          sourceReference: pastQuiz.id,
        },
      },
      update: {},
      create: {
        userId: karthikId,
        quizId: pastQuiz.id,
        source: "QUIZ_RANK_3",
        sourceReference: pastQuiz.id,
        points: 120,
        description: "3rd Place in PostgreSQL Database Internals Championship",
      },
    });

    console.log(`✅ Sample leaderboard and results seeded.`);
  }

  console.log("🚀 Neon PostgreSQL database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
