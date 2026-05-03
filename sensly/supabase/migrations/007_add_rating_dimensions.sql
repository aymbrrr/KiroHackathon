-- Add temperature and texture dimensions to ratings
-- Additive change — no breaking changes to existing data

alter table ratings add column if not exists temperature smallint check (temperature between 1 and 5);
alter table ratings add column if not exists texture smallint check (texture between 1 and 5);
