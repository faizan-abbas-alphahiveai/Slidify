/*
  # Update share messages with new content and icons

  1. Changes
    - Clear existing share messages
    - Insert 20 new messages with creative content
    - Each message has a specific Lucide icon assigned
    - All messages are set to active status

  2. New Messages
    - Fun, celebratory messages for slideshow completion
    - Each paired with an appropriate Lucide icon
    - Icons include: sparkles, clapperboard, film, users, camera, video, mic, etc.
*/

-- Clear existing share messages
DELETE FROM public.share_messages;

-- Insert new share messages with icons
INSERT INTO public.share_messages (message, icon_name, is_active, user_id) VALUES
('Ta-da! Your slideshow is ready for its big debut', 'Sparkles', true, null),
('It''s showtime! Share your masterpiece with the world', 'Clapperboard', true, null),
('That''s a wrap! Now let''s roll the credits or just hit share', 'Film', true, null),
('Slideshow complete. Your audience awaits', 'Users', true, null),
('From clicks to clips – your story is ready to shine', 'Camera', true, null),
('Lights, camera, slideshow! Ready to share the magic', 'Video', true, null),
('Mic drop. You nailed it. Time to show it off', 'Mic', true, null),
('And… scene! Now let''s hit that share button', 'PlayCircle', true, null),
('Well done, Spielberg. Want to show off your work', 'Megaphone', true, null),
('Boom! You just created slideshow gold. Go ahead, brag a little', 'Star', true, null),
('Slideshow? More like slay-show. Time to share', 'Flame', true, null),
('You just made something awesome. Now let the world see it', 'Eye', true, null),
('Chef''s kiss – your slideshow is deliciously done. Ready to serve', 'ChefHat', true, null),
('You''ve spun the magic. Now spread the sparkle', 'Wand2', true, null),
('It''s giving… iconic. Share it with the fans', 'Crown', true, null),
('Slideshow: 100 percent cooked and ready to be served hot', 'Pizza', true, null),
('Ready to go viral? Click share and let''s find out', 'Send', true, null),
('Nice work! Your slideshow has entered its main character era', 'User', true, null),
('You pressed the buttons, we made the magic. Want to share it', 'Wand2', true, null),
('It''s done. It''s fabulous. And it''s waiting to be shared', 'Share', true, null);