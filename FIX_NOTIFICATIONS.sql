-- 1. Fix Notification RLS Policies
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
CREATE POLICY "Anyone can view notifications" 
ON public.notifications FOR SELECT 
USING (true);

-- Notification Recipients Policies
DROP POLICY IF EXISTS "Users can view own recipients" ON public.notification_recipients;
CREATE POLICY "Users can view own recipients" 
ON public.notification_recipients FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own status" ON public.notification_recipients;
CREATE POLICY "Users can update own status" 
ON public.notification_recipients FOR UPDATE
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix Enrollment Requests RLS
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollment_requests" ON public.enrollment_requests;
CREATE POLICY "Users can view own enrollment_requests"
ON public.enrollment_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage enrollment_requests" ON public.enrollment_requests;
CREATE POLICY "Admins can manage enrollment_requests"
ON public.enrollment_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. ENSURE ADMIN ROLE (CRITICAL)
-- Replace the UUID below with your actual User ID if you are not getting notifications.
-- You can find your ID in the 'Profiles' table or 'Auth' list.
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('3f0cbcab-4630-4d2e-bf31-3cf0769b3fc9', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Reload schema
NOTIFY pgrst, 'reload schema';
