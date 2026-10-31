-- Keep the event account on the same six-digit PIN policy as customers.
update customers
set password_hash = '$2a$10$3Il7GkhSmBeaY4nm2y6ife6wb8n7.Z7870j5h4fsklciLm4cJo2Wu', updated_at = now()
where lower(email) = 'halloween@gmail.com';
