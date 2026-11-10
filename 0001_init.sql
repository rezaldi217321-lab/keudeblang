CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK(price >= 0),
  emoji TEXT DEFAULT '☕',
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  total INTEGER NOT NULL,
  cash_received INTEGER NOT NULL,
  item_count INTEGER NOT NULL,
  items_json TEXT NOT NULL
);
INSERT OR IGNORE INTO products(id,name,category,price,emoji) VALUES
('kopi-cangking','Kopi Cangking','Kopi',4000,'☕'),
('kopi-kantong','Kopi Kantong','Kopi',7000,'🛍️'),
('kue-1','Kue kecil','Kue',1000,'🍪'),
('kue-2','Kue sedang','Kue',2000,'🧁'),
('kue-5','Kue besar','Kue',5000,'🍰'),
('kopi-saset-panas','Kopi Saset Panas','Kopi',4000,'☕'),
('kopi-saset-dingin','Kopi Saset Dingin','Kopi',6000,'🧋'),
('kopi-tambahan','Tambahan Kopi','Tambahan',1000,'➕'),
('teh-dingin','Teh Dingin','Teh',5000,'🧊'),
('teh-panas-3','Teh Panas kecil','Teh',3000,'🍵'),
('teh-panas-4','Teh Panas besar','Teh',4000,'🍵'),
('kacang-hijau','Kacang Hijau Biasa','Makanan',5000,'🥣'),
('kacang-hijau-susu','Kacang Hijau Susu','Makanan',7000,'🥛'),
('agar-agar','Agar-agar','Makanan',5000,'🍮');
