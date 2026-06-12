-- Remove tabelas criadas na migration 20260611120000 que não são usadas pelo app.
-- O app usa meal_logs (com source='IOT') e o bucket meal-photos (migration 130000).
-- As tabelas smart_bottle_logs e nutrition_photos foram descartadas na revisão de arquitetura.

DROP TABLE IF EXISTS smart_bottle_logs CASCADE;
DROP TABLE IF EXISTS nutrition_photos CASCADE;
