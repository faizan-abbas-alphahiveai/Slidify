/*
  # Update share messages with new content

  1. Updates
    - Replace all existing share messages with new creative content
    - Set all messages to active status
    - Keep existing icon_name as 'SquareUserRound'

  2. New Messages
    - 20 new creative and engaging share messages
    - All messages use 'SquareUserRound' icon
    - Messages have a fun, celebratory tone
*/

-- Update existing messages with new content
UPDATE share_messages SET 
  message = 'Ta-da! Your slideshow is ready for its big debut',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 0);

UPDATE share_messages SET 
  message = 'It''s showtime! Share your masterpiece with the world',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 1);

UPDATE share_messages SET 
  message = 'That''s a wrap! Now let''s roll the credits or just hit share',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 2);

UPDATE share_messages SET 
  message = 'Slideshow complete. Your audience awaits',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 3);

UPDATE share_messages SET 
  message = 'From clicks to clips – your story is ready to shine',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 4);

UPDATE share_messages SET 
  message = 'Lights, camera, slideshow! Ready to share the magic',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 5);

UPDATE share_messages SET 
  message = 'Mic drop. You nailed it. Time to show it off',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 6);

UPDATE share_messages SET 
  message = 'And… scene! Now let''s hit that share button',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 7);

UPDATE share_messages SET 
  message = 'Well done, Spielberg. Want to show off your work',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 8);

UPDATE share_messages SET 
  message = 'Boom! You just created slideshow gold. Go ahead, brag a little',
  is_active = true,
  updated_at = now()
WHERE id = (SELECT id FROM share_messages ORDER BY created_at LIMIT 1 OFFSET 9);

-- Insert remaining messages (assuming we had 10 existing messages)
INSERT INTO share_messages (message, is_active, icon_name, user_id) VALUES
('Slideshow? More like slay-show. Time to share', true, 'SquareUserRound', null),
('You just made something awesome. Now let the world see it', true, 'SquareUserRound', null),
('Chef''s kiss – your slideshow is deliciously done. Ready to serve', true, 'SquareUserRound', null),
('You''ve spun the magic. Now spread the sparkle', true, 'SquareUserRound', null),
('It''s giving… iconic. Share it with the fans', true, 'SquareUserRound', null),
('Slideshow: 100 percent cooked and ready to be served hot', true, 'SquareUserRound', null),
('Ready to go viral? Click share and let''s find out', true, 'SquareUserRound', null),
('Nice work! Your slideshow has entered its main character era', true, 'SquareUserRound', null),
('You pressed the buttons, we made the magic. Want to share it', true, 'SquareUserRound', null),
('It''s done. It''s fabulous. And it''s waiting to be shared', true, 'SquareUserRound', null);