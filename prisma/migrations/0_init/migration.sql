-- Baseline migration for REVERSUN Quiz Platform
-- PostgreSQL 15+ / Neon Database

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUMS
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE quiz_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE quiz_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE question_type AS ENUM ('SINGLE', 'MULTIPLE');
CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'INVALIDATED');
CREATE TYPE certificate_type AS ENUM ('PARTICIPATION', 'WINNER', 'ACHIEVEMENT');

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  age INTEGER CHECK (age IS NULL OR age BETWEEN 1 AND 120),
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  profile_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- QUIZ CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- QUIZZES
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty quiz_difficulty NOT NULL DEFAULT 'MEDIUM',
  status quiz_status NOT NULL DEFAULT 'DRAFT',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  max_participants INTEGER CHECK (max_participants IS NULL OR max_participants > 0),
  max_attempts INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts > 0),
  negative_marking BOOLEAN NOT NULL DEFAULT FALSE,
  results_publish_at TIMESTAMPTZ,
  certificates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

-- QUESTIONS
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  image_url TEXT,
  type question_type NOT NULL,
  marks NUMERIC(8,2) NOT NULL DEFAULT 1,
  negative_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
  explanation TEXT,
  position INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (quiz_id, position),
  CHECK (marks >= 0 AND negative_marks >= 0)
);

-- ANSWER OPTIONS
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  UNIQUE (question_id, position)
);

-- REGISTRATIONS
CREATE TABLE quiz_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quiz_id, user_id)
);

-- ATTEMPTS
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  total_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quiz_id, user_id, attempt_number)
);

-- ANSWERS
CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  is_correct BOOLEAN,
  awarded_marks NUMERIC(8,2),
  answered_at TIMESTAMPTZ,
  UNIQUE (attempt_id, question_id)
);

-- SELECTED OPTIONS
CREATE TABLE attempt_answer_options (
  answer_id UUID NOT NULL REFERENCES attempt_answers(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES question_options(id),
  PRIMARY KEY (answer_id, option_id)
);

-- FINAL RESULTS
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id),
  score NUMERIC(10,2) NOT NULL,
  rank INTEGER NOT NULL,
  position INTEGER,
  completion_time_ms BIGINT,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quiz_id, user_id),
  UNIQUE (quiz_id, rank)
);

-- PRIZES
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL DEFAULT 'OTHER',
  reward_value NUMERIC(12,2),
  reward_currency TEXT,
  UNIQUE (quiz_id, position)
);

-- POINT LEDGER
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  quiz_id UUID REFERENCES quizzes(id),
  source TEXT NOT NULL,
  source_reference UUID,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source, source_reference)
);

-- CERTIFICATES
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  quiz_id UUID REFERENCES quizzes(id),
  type certificate_type NOT NULL,
  position INTEGER,
  score NUMERIC(10,2),
  pdf_url TEXT,
  image_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_quizzes_status_dates ON quizzes(status, starts_at, ends_at);
CREATE INDEX idx_questions_quiz ON questions(quiz_id, position);
CREATE INDEX idx_registrations_quiz ON quiz_registrations(quiz_id);
CREATE INDEX idx_registrations_user ON quiz_registrations(user_id);
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id, created_at DESC);
CREATE INDEX idx_attempts_quiz ON quiz_attempts(quiz_id, status);
CREATE INDEX idx_results_leaderboard ON quiz_results(quiz_id, rank);
CREATE INDEX idx_points_user_date ON point_transactions(user_id, created_at DESC);
CREATE INDEX idx_certificates_user ON certificates(user_id, issued_at DESC);
