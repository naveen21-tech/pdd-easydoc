-- SQL Migration for Supabase Tables & RLS Policies
-- StudentDoc Document Generation Platform

-- 1. Create Project Table
CREATE TABLE IF NOT EXISTS public."Project" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "userId" TEXT NOT NULL REFERENCES public."Profile"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "problemStatement" TEXT,
  "objectives" TEXT,
  "targetUsers" TEXT,
  "techStack" JSONB,
  "modules" JSONB,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Alter Document to include projectId column if missing
ALTER TABLE public."Document" ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES public."Project"("id") ON DELETE SET NULL;

-- 3. Create Presentation Table
CREATE TABLE IF NOT EXISTS public."Presentation" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "userId" TEXT NOT NULL REFERENCES public."Profile"("id") ON DELETE CASCADE,
  "documentId" TEXT,
  "title" TEXT NOT NULL,
  "style" TEXT NOT NULL DEFAULT 'Academic',
  "slides" JSONB NOT NULL,
  "theme" JSONB,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create VivaSession Table (Used by MCQ Studio & Technical Defense)
CREATE TABLE IF NOT EXISTS public."VivaSession" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "userId" TEXT NOT NULL REFERENCES public."Profile"("id") ON DELETE CASCADE,
  "documentId" TEXT,
  "projectId" TEXT,
  "title" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'Intermediate',
  "questions" JSONB NOT NULL,
  "totalScore" INTEGER,
  "feedback" JSONB,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create DocumentVerification Table
CREATE TABLE IF NOT EXISTS public."DocumentVerification" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "verificationId" TEXT UNIQUE NOT NULL,
  "documentId" TEXT UNIQUE NOT NULL REFERENCES public."Document"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "documentTitle" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "isRevoked" BOOLEAN NOT NULL DEFAULT false,
  "issuedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP WITHOUT TIME ZONE,
  "scanCount" INTEGER NOT NULL DEFAULT 0
);

-- 6. Create DocumentHealthReport Table
CREATE TABLE IF NOT EXISTS public."DocumentHealthReport" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "documentId" TEXT UNIQUE NOT NULL REFERENCES public."Document"("id") ON DELETE CASCADE,
  "overallScore" INTEGER NOT NULL DEFAULT 100,
  "structureScore" INTEGER NOT NULL DEFAULT 100,
  "readabilityScore" INTEGER NOT NULL DEFAULT 100,
  "grammarScore" INTEGER NOT NULL DEFAULT 100,
  "professionalismScore" INTEGER NOT NULL DEFAULT 100,
  "completenessScore" INTEGER NOT NULL DEFAULT 100,
  "formattingScore" INTEGER NOT NULL DEFAULT 100,
  "issues" JSONB,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create CareerProfile Table
CREATE TABLE IF NOT EXISTS public."CareerProfile" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "userId" TEXT NOT NULL REFERENCES public."Profile"("id") ON DELETE CASCADE,
  "targetRole" TEXT,
  "resumeData" JSONB NOT NULL,
  "atsScore" INTEGER,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Enable Row Level Security (RLS) on all new tables
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Presentation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VivaSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DocumentVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DocumentHealthReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CareerProfile" ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for "Project"
DROP POLICY IF EXISTS "Users manage own projects or admin reads all" ON public."Project";
CREATE POLICY "Users manage own projects or admin reads all"
  ON public."Project" FOR ALL
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()))
  WITH CHECK ("userId" = auth.uid()::text OR is_admin(auth.uid()));

-- 10. RLS Policies for "Presentation"
DROP POLICY IF EXISTS "Users manage own presentations or admin reads all" ON public."Presentation";
CREATE POLICY "Users manage own presentations or admin reads all"
  ON public."Presentation" FOR ALL
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()))
  WITH CHECK ("userId" = auth.uid()::text OR is_admin(auth.uid()));

-- 11. RLS Policies for "VivaSession"
DROP POLICY IF EXISTS "Users manage own viva sessions or admin reads all" ON public."VivaSession";
CREATE POLICY "Users manage own viva sessions or admin reads all"
  ON public."VivaSession" FOR ALL
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()))
  WITH CHECK ("userId" = auth.uid()::text OR is_admin(auth.uid()));

-- 12. RLS Policies for "DocumentVerification"
DROP POLICY IF EXISTS "Verification records are publicly verifiable" ON public."DocumentVerification";
CREATE POLICY "Verification records are publicly verifiable"
  ON public."DocumentVerification" FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users insert/manage own verification records" ON public."DocumentVerification";
CREATE POLICY "Users insert/manage own verification records"
  ON public."DocumentVerification" FOR ALL
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()))
  WITH CHECK ("userId" = auth.uid()::text OR is_admin(auth.uid()));

-- 13. RLS Policies for "DocumentHealthReport"
DROP POLICY IF EXISTS "Users manage health reports for own documents" ON public."DocumentHealthReport";
CREATE POLICY "Users manage health reports for own documents"
  ON public."DocumentHealthReport" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."Document" d
      WHERE d.id = "DocumentHealthReport"."documentId"
      AND (d."userId" = auth.uid()::text OR is_admin(auth.uid()))
    )
  );

-- 14. RLS Policies for "CareerProfile"
DROP POLICY IF EXISTS "Users manage own career profiles or admin reads all" ON public."CareerProfile";
CREATE POLICY "Users manage own career profiles or admin reads all"
  ON public."CareerProfile" FOR ALL
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()))
  WITH CHECK ("userId" = auth.uid()::text OR is_admin(auth.uid()));
