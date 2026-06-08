insert into categories (name, sort_order, is_default, is_active) values
('Jarðvinna', 1, true, true),
('Burðarvirki', 2, true, true),
('Lagnakerfi', 3, true, true),
('Rafkerfi', 4, true, true),
('Innanhúsfrágangur', 5, true, true),
('Laus búnaður', 6, true, true),
('Utanhúsfrágangur', 7, true, true),
('Lóðarfrágangur', 8, true, true),
('Ófyrirséð', 9, true, true);

insert into subcategories (category_id, name, sort_order, is_default, is_active)
select c.id, s.name, s.sort_order, true, true
from categories c
join (
  values
  ('Jarðvinna', 'Bílastæði', 1), ('Jarðvinna', 'Aðstaða', 2), ('Jarðvinna', 'Jarðvinna', 3),
  ('Burðarvirki', 'Uppsteypa', 1),
  ('Lagnakerfi', 'Pípulögn', 1), ('Lagnakerfi', 'Loftræsting', 2), ('Lagnakerfi', 'Hreinlætistæki', 3),
  ('Rafkerfi', 'Rafmagn', 1), ('Rafkerfi', 'Lyfta', 2),
  ('Innanhúsfrágangur', 'Flotun', 1), ('Innanhúsfrágangur', 'Múrverk', 2), ('Innanhúsfrágangur', 'Gipsveggir', 3),
  ('Innanhúsfrágangur', 'Málun', 4), ('Innanhúsfrágangur', 'Flísalögn', 5), ('Innanhúsfrágangur', 'Innréttingar', 6),
  ('Innanhúsfrágangur', 'Rafmagn', 7), ('Innanhúsfrágangur', 'Innihurðar', 8), ('Innanhúsfrágangur', 'Sólbekkir', 9),
  ('Innanhúsfrágangur', 'Frágangur', 10), ('Innanhúsfrágangur', 'Þrif', 11),
  ('Laus búnaður', 'Laus búnaður', 1), ('Laus búnaður', 'Annað', 2),
  ('Utanhúsfrágangur', 'Einangrun', 1), ('Utanhúsfrágangur', 'Klæðning', 2), ('Utanhúsfrágangur', 'Múrverk út', 3),
  ('Utanhúsfrágangur', 'Gluggar', 4), ('Utanhúsfrágangur', 'Gler', 5), ('Utanhúsfrágangur', 'Þakfrágangur', 6), ('Utanhúsfrágangur', 'Svalahandrið', 7),
  ('Lóðarfrágangur', 'Lóðarfrágangur', 1),
  ('Ófyrirséð', 'Ófyrirséð', 1)
) as s(category_name, name, sort_order) on s.category_name = c.name;
