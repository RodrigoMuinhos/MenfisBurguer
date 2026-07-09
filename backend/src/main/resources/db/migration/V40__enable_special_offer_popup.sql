update app_settings
set value = replace(value, '"enabled":false', '"enabled":true'),
    updated_at = now()
where key = 'special_offer_settings'
  and value like '%"enabled":false%';
