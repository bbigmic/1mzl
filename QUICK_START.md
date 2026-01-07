# ⚡ Quick Start Guide - ContentAI Pro

## Szybki start w 5 minut

### 1. Instalacja

```bash
# Sklonuj lub pobierz projekt
cd 1MZL

# Zainstaluj zależności
npm install
```

### 2. Konfiguracja minimalna (dla testów)

Utwórz plik `.env`:

```env
# Minimalna konfiguracja do testów
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-change-in-production"
OPENAI_API_KEY="sk-your-openai-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Uwaga:** Dla produkcji użyj PostgreSQL zamiast SQLite!

### 3. Baza danych

```bash
# Wygeneruj Prisma Client
npm run db:generate

# Utwórz bazę danych (SQLite dla dev)
npx prisma db push
```

### 4. Uruchom aplikację

```bash
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000)

### 5. Testowanie bez logowania (development)

Dla szybkiego testowania możesz tymczasowo wyłączyć autoryzację w `app/api/generate/route.ts`:

```typescript
// Tymczasowo zakomentuj sprawdzanie sesji
// if (!session?.user?.id) {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// }
```

**Pamiętaj:** Przywróć to przed wdrożeniem!

## Testowanie funkcji

### 1. Generowanie treści

1. Zaloguj się (lub wyłącz autoryzację dla testów)
2. Przejdź do Dashboard
3. Wypełnij formularz:
   - Typ: Artykuł blogowy
   - Prompt: "Jak napisać dobry artykuł blogowy?"
   - Kliknij "Generuj treść"

### 2. Testowanie limitów

- Free plan: 10 generacji/dzień
- Sprawdź czy limit działa po 10 generacjach

### 3. Testowanie Stripe (test mode)

1. Utwórz konto Stripe (test mode)
2. Dodaj klucze do `.env`
3. Utwórz produkty i ceny
4. Przetestuj checkout flow

## Rozwiązywanie problemów

### Błąd: "OPENAI_API_KEY is not set"

- Sprawdź czy `.env` istnieje
- Sprawdź czy klucz jest poprawny
- Restart serwera dev (`npm run dev`)

### Błąd: "Database connection failed"

- Sprawdź `DATABASE_URL` w `.env`
- Dla SQLite: upewnij się że masz uprawnienia do zapisu
- Dla PostgreSQL: sprawdź czy baza działa

### Błąd: "Prisma Client not generated"

```bash
npm run db:generate
```

### Strona się nie ładuje

```bash
# Wyczyść cache
rm -rf .next
npm run dev
```

## Następne kroki

1. ✅ Aplikacja działa lokalnie
2. 📖 Przeczytaj [README.md](./README.md) dla pełnej dokumentacji
3. 🚀 Przeczytaj [DEPLOYMENT.md](./DEPLOYMENT.md) dla wdrożenia
4. 💰 Przeczytaj [MONETIZATION.md](./MONETIZATION.md) dla strategii biznesowej

---

**Gotowe! Aplikacja powinna działać! 🎉**

