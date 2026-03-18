INSERT INTO "Permission" ("key","description")
VALUES
  ('warehouse.locations.manage','Управление складами и локациями'),
  ('warehouse.recipes.manage','Управление рецептурами'),
  ('warehouse.production','Производство (списание сырья и выпуск)'),
  ('warehouse.inventory','Инвентаризация (сверка и корректировки)')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleName","permissionKey")
SELECT r.roleName, r.permissionKey
FROM (
  VALUES
    ('admin','warehouse.locations.manage'),
    ('admin','warehouse.recipes.manage'),
    ('admin','warehouse.production'),
    ('admin','warehouse.inventory'),

    ('manager','warehouse.locations.manage'),
    ('manager','warehouse.recipes.manage'),
    ('manager','warehouse.production'),
    ('manager','warehouse.inventory'),

    ('engineer','warehouse.production'),
    ('warehouse','warehouse.production'),
    ('warehouse','warehouse.inventory'),
    ('accountant','warehouse.inventory')
) AS r(roleName, permissionKey)
ON CONFLICT ("roleName","permissionKey") DO NOTHING;

