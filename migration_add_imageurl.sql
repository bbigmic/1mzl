-- Migracja: Dodanie pola imageUrl do tabeli Content
-- Uruchom ten skrypt, jeśli tabela Content już istnieje i chcesz dodać nowe pole

-- Dodaj kolumnę imageUrl (opcjonalną, nullable)
ALTER TABLE "Content" 
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Komentarz do kolumny
COMMENT ON COLUMN "Content"."imageUrl" IS 'URL do wygenerowanego zdjęcia przez OpenAI DALL-E';

-- Sprawdź czy kolumna została dodana
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Content' AND column_name = 'imageUrl';

