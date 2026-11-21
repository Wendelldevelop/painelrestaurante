-- Banco do Comanda+ (SQLite). Cada restaurante só enxerga os próprios dados: toda consulta filtra por restaurante_id.
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS restaurantes (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,            -- usado nas URLs: /casa-brasa/painel
  nome TEXT NOT NULL,
  plano TEXT NOT NULL DEFAULT 'Mesa Completa',
  ativo INTEGER NOT NULL DEFAULT 1,     -- 0 = suspenso (ex.: falta de pagamento)
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  senha TEXT NOT NULL,                  -- scrypt$sal$hash (nunca a senha em texto)
  funcao TEXT NOT NULL DEFAULT 'gerente',
  ativo INTEGER NOT NULL DEFAULT 1,
  UNIQUE (restaurante_id, email)
);

CREATE TABLE IF NOT EXISTS mesas (
  id INTEGER PRIMARY KEY,
  restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id),
  numero INTEGER NOT NULL,              -- 0 = QR do balcão
  token TEXT NOT NULL,                  -- código secreto que vai no QR Code
  UNIQUE (restaurante_id, numero)
);

CREATE TABLE IF NOT EXISTS eventos (    -- tudo o que acontece: pedidos, status, contas fechadas
  id INTEGER PRIMARY KEY,
  restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  papel TEXT NOT NULL,                  -- cliente | painel
  tipo TEXT NOT NULL,
  num INTEGER,
  mesa TEXT,
  cid TEXT,
  dados TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS eventos_rest_data ON eventos (restaurante_id, criado_em);
CREATE INDEX IF NOT EXISTS eventos_pedido ON eventos (restaurante_id, tipo, num);
