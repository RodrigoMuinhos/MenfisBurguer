-- Dedicated event login. Store only the BCrypt password hash.
insert into customers (name, email, password_hash, updated_at)
select 'Halloween', 'halloween@gmail.com', '$2a$10$9iuewWrZkPcu28k6Yt5Id.hLckj68YmbOOZmUyboiVGDlkUtqLhyq', now()
where not exists (select 1 from customers where lower(email) = 'halloween@gmail.com');
