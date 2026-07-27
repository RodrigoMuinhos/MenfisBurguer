update addons
set price = 8.90,
    active = true
where id in (
  'salad-pink-lemonade',
  'salad-purple-lemonade',
  'salad-sunset-lemonade'
);
