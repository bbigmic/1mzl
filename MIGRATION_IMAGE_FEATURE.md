# 🖼️ Migracja - Funkcja generowania zdjęć

## Co zostało dodane?

Funkcja generowania mistrzowskich zdjęć przez OpenAI DALL-E 3 dla każdej wygenerowanej treści.

## Zmiany w bazie danych

Dodano nowe pole `imageUrl` do modelu `Content`:

```prisma
model Content {
  // ... istniejące pola
  imageUrl    String?  // URL do wygenerowanego zdjęcia
  // ...
}
```

## Migracja bazy danych

Po dodaniu nowego pola, musisz zaktualizować bazę danych:

```bash
# Wygeneruj Prisma Client z nowym schematem
npm run db:generate

# Zastosuj zmiany w bazie danych
npm run db:push
```

**Uwaga:** To nie usunie istniejących danych - tylko doda nowe pole (opcjonalne, nullable).

## Nowe funkcje

### 1. Generowanie zdjęć
- Przycisk z ikoną aparatu przy każdej karcie treści
- Generuje zdjęcie w stylu dopasowanym do typu treści:
  - **Artykuły**: Profesjonalne, edytorialne zdjęcia
  - **Posty**: Kolorowe, angażujące zdjęcia na social media
  - **Produkty**: Studio photography, czyste tło
  - **Emaile**: Corporate style, biznesowe
  - **Reklamy**: Przyciągające uwagę, marketingowe

### 2. Wyświetlanie zdjęć
- Wygenerowane zdjęcia są wyświetlane pod treścią
- Responsywny design
- Wysoka jakość (1024x1024, HD)

### 3. API Endpoint
- `/api/generate-image` - generuje zdjęcie dla danej treści
- Weryfikuje własność treści
- Zapobiega podwójnemu generowaniu

## Koszty OpenAI

**DALL-E 3:**
- $0.040 za obraz (1024x1024, HD)
- ~0.16 PLN za zdjęcie

**Rekomendacja:** 
- Możesz dodać limit generacji zdjęć do planów subskrypcyjnych
- Lub dodać osobny limit dla zdjęć (np. 5 zdjęć/dzień dla Free, 50 dla Pro)

## Testowanie

1. Wygeneruj treść
2. Kliknij przycisk z ikoną aparatu przy karcie treści
3. Poczekaj na wygenerowanie (10-30 sekund)
4. Zdjęcie pojawi się pod treścią

## Troubleshooting

### Błąd: "Nie udało się wygenerować zdjęcia"
- Sprawdź czy `OPENAI_API_KEY` jest ustawiony
- Sprawdź czy masz środki na koncie OpenAI
- Sprawdź limity API OpenAI

### Zdjęcie się nie wyświetla
- Sprawdź czy URL jest poprawny
- Sprawdź konfigurację `next.config.js` (remotePatterns)
- Sprawdź konsolę przeglądarki pod kątem błędów CORS

---

**Gotowe! Funkcja generowania zdjęć jest aktywna! 🎨**

