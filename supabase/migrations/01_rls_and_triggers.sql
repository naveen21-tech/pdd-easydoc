-- SQL Migration for Supabase RLS & Auth Triggers
-- EasyDoc Document Generation Platform

-- 1. Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."Profile"
    WHERE id = user_id::text AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Postgres Trigger to create a public."Profile" when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."Profile" (id, email, name, role, plan, "createdAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'USER'::public."Role",
    'Free',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;


-- 4. RLS Policies for "Profile"
DROP POLICY IF EXISTS "Users can select own profile or admins read all" ON public."Profile";
CREATE POLICY "Users can select own profile or admins read all"
  ON public."Profile" FOR SELECT
  USING (id = auth.uid()::text OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public."Profile";
CREATE POLICY "Users can update own profile"
  ON public."Profile" FOR UPDATE
  USING (id = auth.uid()::text);


-- 5. RLS Policies for "Document"
DROP POLICY IF EXISTS "Users read own documents or admin reads all" ON public."Document";
CREATE POLICY "Users read own documents or admin reads all"
  ON public."Document" FOR SELECT
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users insert own documents" ON public."Document";
CREATE POLICY "Users insert own documents"
  ON public."Document" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own documents" ON public."Document";
CREATE POLICY "Users update own documents"
  ON public."Document" FOR UPDATE
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own documents" ON public."Document";
CREATE POLICY "Users delete own documents"
  ON public."Document" FOR DELETE
  USING ("userId" = auth.uid()::text);


-- 6. RLS Policies for "Template"
DROP POLICY IF EXISTS "Templates are viewable by authenticated users" ON public."Template";
CREATE POLICY "Templates are viewable by authenticated users"
  ON public."Template" FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage templates" ON public."Template";
CREATE POLICY "Admins manage templates"
  ON public."Template" FOR ALL
  USING (is_admin(auth.uid()));


-- 7. RLS Policies for "AIRequest"
DROP POLICY IF EXISTS "Users read own AI requests or admin reads all" ON public."AIRequest";
CREATE POLICY "Users read own AI requests or admin reads all"
  ON public."AIRequest" FOR SELECT
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users insert own AI requests" ON public."AIRequest";
CREATE POLICY "Users insert own AI requests"
  ON public."AIRequest" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);


-- 8. RLS Policies for "Notification"
DROP POLICY IF EXISTS "Users read own notifications or admin reads all" ON public."Notification";
CREATE POLICY "Users read own notifications or admin reads all"
  ON public."Notification" FOR SELECT
  USING ("userId" = auth.uid()::text OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users manage own notifications" ON public."Notification";
CREATE POLICY "Users manage own notifications"
  ON public."Notification" FOR ALL
  USING ("userId" = auth.uid()::text);
