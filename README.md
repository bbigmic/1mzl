# ContentAI Pro - Micro SaaS Platform

Profesjonalna platforma do generowania treści z wykorzystaniem sztucznej inteligencji (OpenAI). Aplikacja gotowa do produkcji z pełnym systemem subskrypcji, płatności i zarządzania użytkownikami.

## 🚀 Funkcje

- **Generowanie treści z AI** - Artykuły, posty, opisy produktów, emaile i reklamy
- **System subskrypcji** - 3 plany: Free, Pro, Enterprise
- **Integracja Stripe** - Automatyczne płatności i zarządzanie subskrypcjami
- **Dashboard użytkownika** - Historia treści, statystyki, zarządzanie
- **Autoryzacja** - NextAuth.js z Google OAuth
- **Nowoczesny UI** - Responsywny design z Tailwind CSS

## 📋 Wymagania

- Node.js 18+ 
- PostgreSQL (lub SQLite dla developmentu)
- Konto OpenAI z kluczem API
- Konto Stripe (dla płatności)

## 🛠️ Instalacja

### 1. Sklonuj repozytorium i zainstaluj zależności

```bash
npm install
```

### 2. Skonfiguruj zmienne środowiskowe

Skopiuj `.env.example` do `.env` i wypełnij:

```bash
cp .env.example .env
```

Wypełnij następujące zmienne:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/contentai?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="wygeneruj-klucz-openssl-rand-base64-32"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."

# Google OAuth (opcjonalne, dla logowania)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Wygeneruj klucz NextAuth Secret

```bash
openssl rand -base64 32
```

### 4. Skonfiguruj bazę danych

```bash
# Wygeneruj Prisma Client
npm run db:generate

# Utwórz tabele w bazie danych
npm run db:push
```

### 5. Skonfiguruj Stripe

1. Zaloguj się do [Stripe Dashboard](https://dashboard.stripe.com)
2. Utwórz produkty i ceny dla planów Pro i Enterprise
3. Skopiuj Price IDs do `.env`
4. Skonfiguruj webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
5. Wybierz eventy: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 6. Skonfiguruj Google OAuth (wymagane dla logowania)

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz **Google+ API** (lub **Google Identity Services API**)
4. Przejdź do **Credentials** → **Create Credentials** → **OAuth client ID**
5. Wybierz typ aplikacji: **Web application**
6. Dodaj **Authorized redirect URIs**:
   - Dla developmentu: `http://localhost:3000/api/auth/callback/google`
   - Dla produkcji: `https://yourdomain.com/api/auth/callback/google`
7. Skopiuj **Client ID** i **Client Secret** do pliku `.env`:
   ```env
   GOOGLE_CLIENT_ID="twoj-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="twoj-client-secret"
   ```
8. **Ważne**: Upewnij się, że zmienne są ustawione w `.env` przed uruchomieniem aplikacji

### 7. Uruchom aplikację

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## 📁 Struktura projektu

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── generate/      # Generowanie treści
│   │   ├── contents/      # Zarządzanie treściami
│   │   └── stripe/        # Płatności Stripe
│   ├── dashboard/         # Dashboard użytkownika
│   ├── pricing/           # Strona cennika
│   └── page.tsx           # Strona główna
├── components/            # Komponenty React
├── lib/                   # Utilities i konfiguracja
│   ├── auth.ts            # NextAuth config
│   ├── openai.ts          # OpenAI integration
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Helper functions
├── prisma/                # Prisma schema
└── types/                 # TypeScript types
```

## 💰 Model monetyzacji

### Plany subskrypcyjne:

- **Free**: 10 generacji/dzień, 1000 słów/treść - **0 PLN/mies.**
- **Pro**: 500 generacji/dzień, 50,000 słów/treść - **99 PLN/mies.**
- **Enterprise**: Nielimitowane - **299 PLN/mies.**

### Potencjał zarobkowy:

Przy założeniu:
- 100 użytkowników Pro (99 PLN/mies.) = **9,900 PLN/mies.**
- 50 użytkowników Enterprise (299 PLN/mies.) = **14,950 PLN/mies.**
- **Łącznie: ~25,000 PLN/mies. = 300,000 PLN/rok**

Przy skalowaniu do 1000 użytkowników Pro i 200 Enterprise:
- **~150,000 PLN/mies. = 1,800,000 PLN/rok** 🎯

## 🚀 Wdrożenie

### Vercel (Rekomendowane)

1. Połącz repozytorium z Vercel
2. Dodaj zmienne środowiskowe w ustawieniach
3. Skonfiguruj PostgreSQL (Vercel Postgres lub zewnętrzny)
4. Wdróż!

### Inne platformy

Aplikacja może być wdrożona na:
- Railway
- Render
- DigitalOcean App Platform
- AWS/Azure/GCP

## 🔒 Bezpieczeństwo

- Wszystkie API routes są chronione autoryzacją
- Weryfikacja limitów subskrypcji przed generowaniem
- Secure session management z NextAuth
- Webhook signature verification dla Stripe

## 📝 Licencja

Ten projekt jest własnością prywatną. Wszelkie prawa zastrzeżone.

## 🤝 Wsparcie

W razie pytań lub problemów, utwórz issue w repozytorium.

---

**Powodzenia w zarabianiu miliona złotych! 💰🚀**

