@@ .. @@
   slideshow_id uuid REFERENCES slideshows(id) ON DELETE CASCADE,
   creator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
-  session_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
+  session_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
   max_uploads integer DEFAULT 100 NOT NULL,