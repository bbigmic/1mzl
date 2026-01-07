# 🚀 Przewodnik wdrożenia ContentAI Pro

## Krok po kroku - Wdrożenie do produkcji

### 1. Przygotowanie środowiska

#### A. Baza danych PostgreSQL

**Opcja A: Vercel Postgres (Rekomendowane)**
1. W Vercel Dashboard, przejdź do projektu
2. Kliknij "Storage" → "Create Database" → "Postgres"
3. Skopiuj `DATABASE_URL` do zmiennych środowiskowych

**Opcja B: Supabase (Darmowe)**
1. Utwórz konto na [supabase.com](https://supabase.com)
2. Utwórz nowy projekt
3. Skopiuj connection string z Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Opcja C: Railway/Render**
1. Utwórz nowy PostgreSQL database
2. Skopiuj `DATABASE_URL`

#### B. OpenAI API Key

1. Zaloguj się do [OpenAI Platform](https://platform.openai.com)
2. Przejdź do API Keys
3. Utwórz nowy klucz
4. Skopiuj do `OPENAI_API_KEY`

**Ważne:** Ustaw limit wydatków w OpenAI Dashboard!

#### C. Stripe Setup

1. **Utwórz konto Stripe**
   - [dashboard.stripe.com](https://dashboard.stripe.com)
   - Przełącz na tryb Live (po testach)

2. **Utwórz produkty i ceny**
   - Products → Add Product
   - **Pro Plan**: 99 PLN/miesiąc (Recurring)
   - **Enterprise Plan**: 299 PLN/miesiąc (Recurring)
   - Skopiuj Price IDs (zaczynają się od `price_...`)

3. **Skonfiguruj Webhook**
   - Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events do subskrypcji:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Skopiuj Signing secret (zaczyna się od `whsec_...`)

4. **Skopiuj klucze API**
   - Developers → API keys
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

#### D. Google OAuth (Opcjonalne)

1. [Google Cloud Console](https://console.cloud.google.com)
2. Utwórz projekt
3. APIs & Services → Credentials
4. Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (dla dev)
7. Skopiuj Client ID i Client Secret

### 2. Wdrożenie na Vercel

#### A. Przygotowanie repozytorium

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/contentai-pro.git
git push -u origin main
```

#### B. Wdrożenie

1. Przejdź do [vercel.com](https://vercel.com)
2. Import Project → wybierz repozytorium
3. Framework Preset: Next.js
4. Dodaj zmienne środowiskowe:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://yourdomain.vercel.app
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```

5. Kliknij Deploy

#### C. Konfiguracja po wdrożeniu

1. **Zaktualizuj Stripe Webhook URL**
   - Użyj URL z Vercel: `https://yourdomain.vercel.app/api/stripe/webhook`

2. **Zaktualizuj Google OAuth Redirect URI**
   - Dodaj produkcyjny URL do Google Cloud Console

3. **Uruchom migracje bazy danych**
   ```bash
   # Lokalnie z połączeniem do produkcyjnej bazy
   DATABASE_URL="your-prod-url" npx prisma db push
   ```

### 3. Alternatywne platformy

#### Railway

1. Połącz GitHub repo
2. Dodaj PostgreSQL service
3. Dodaj zmienne środowiskowe
4. Deploy!

#### Render

1. New → Web Service
2. Połącz repo
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Dodaj PostgreSQL database
6. Dodaj zmienne środowiskowe

### 4. Testowanie wdrożenia

1. ✅ Sprawdź czy strona główna się ładuje
2. ✅ Przetestuj logowanie
3. ✅ Wygeneruj testową treść
4. ✅ Przetestuj checkout Stripe (test mode)
5. ✅ Sprawdź webhook Stripe w dashboard
6. ✅ Przetestuj wszystkie funkcje

### 5. Optymalizacja i monitoring

#### A. Monitoring

- **Vercel Analytics** - wbudowane
- **Sentry** - error tracking (opcjonalne)
- **PostHog/Mixpanel** - analytics (opcjonalne)

#### B. Performance

- ✅ Obrazy z Next.js Image
- ✅ Lazy loading komponentów
- ✅ Caching API responses
- ✅ Database indexing (dodaj w Prisma schema)

#### C. SEO

- ✅ Meta tags w `layout.tsx`
- ✅ Open Graph tags
- ✅ Sitemap.xml
- ✅ robots.txt

### 6. Skalowanie

#### Gdy aplikacja rośnie:

1. **Database**
   - Connection pooling (PgBouncer)
   - Read replicas dla dużego ruchu

2. **Caching**
   - Redis dla sesji
   - CDN dla statycznych assetów

3. **Rate Limiting**
   - Vercel Edge Config
   - Upstash Redis

4. **Monitoring**
   - Uptime monitoring (UptimeRobot)
   - Error tracking (Sentry)
   - Performance monitoring

### 7. Checklist przed launch

- [ ] Wszystkie zmienne środowiskowe ustawione
- [ ] Baza danych skonfigurowana i zmigrowana
- [ ] Stripe w trybie Live (po testach)
- [ ] Webhook Stripe działa
- [ ] Google OAuth skonfigurowany
- [ ] Testy funkcjonalności przeszły
- [ ] Custom domain skonfigurowany (opcjonalne)
- [ ] SSL certificate działa
- [ ] Analytics skonfigurowane
- [ ] Terms of Service i Privacy Policy (wymagane przez Stripe)

### 8. Marketing i pozyskiwanie użytkowników

1. **Content Marketing**
   - Blog z SEO
   - Case studies
   - Tutoriale

2. **Social Media**
   - Twitter/X
   - LinkedIn
   - Facebook groups

3. **Product Hunt**
   - Launch na Product Hunt
   - Przygotuj dobrą prezentację

4. **SEO**
   - Optymalizacja pod kątem wyszukiwarek
   - Backlinks
   - Guest posting

5. **Paid Ads**
   - Google Ads
   - Facebook Ads
   - LinkedIn Ads

---

**Powodzenia! 🚀**

