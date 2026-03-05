
-- Allow users to update their own credit_points (for deduction)
CREATE POLICY "Users can update own subscription"
ON public.user_subscriptions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
