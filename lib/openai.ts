import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateContent(
  prompt: string,
  type: string,
  options?: {
    tone?: string
    length?: string
    language?: string
  }
): Promise<string> {
  const systemPrompts: Record<string, string> = {
    article: 'Jesteś ekspertem od pisania artykułów blogowych. Twórz angażujące, wartościowe treści z dobrym SEO.',
    post: 'Jesteś ekspertem od social media. Twórz krótkie, angażujące posty, które przyciągają uwagę.',
    product: 'Jesteś ekspertem od copywritingu produktowego. Twórz przekonujące opisy produktów, które sprzedają.',
    email: 'Jesteś ekspertem od email marketingu. Twórz skuteczne emaile, które konwertują.',
    ad: 'Jesteś ekspertem od reklam. Twórz przekonujące teksty reklamowe, które przyciągają klientów.',
  }

  const systemPrompt = systemPrompts[type] || systemPrompts.article

  const userPrompt = options?.tone
    ? `${prompt}\n\nTon: ${options.tone}`
    : prompt

  const lengthInstruction = options?.length
    ? `\nDługość: ${options.length}`
    : ''

  const languageInstruction = options?.language
    ? `\nJęzyk: ${options.language}`
    : ''

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt + lengthInstruction + languageInstruction,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    return completion.choices[0]?.message?.content || 'Błąd generowania treści'
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Nie udało się wygenerować treści. Sprawdź klucz API.')
  }
}

export async function generateImage(
  contentPrompt: string,
  contentType: string
): Promise<string> {
  try {
    // Stwórz optymalny prompt dla DALL-E na podstawie treści
    const imagePrompts: Record<string, string> = {
      article: 'profesjonalne, wysokiej jakości zdjęcie ilustrujące temat artykułu, styl edytorialny, realistyczne, 4K',
      post: 'kolorowe, angażujące zdjęcie na social media, nowoczesne, przyciągające uwagę, wysokiej jakości',
      product: 'profesjonalne zdjęcie produktu, studio photography, czyste tło, komercyjne, wysokiej jakości',
      email: 'profesjonalne zdjęcie biznesowe, corporate style, wysokiej jakości, odpowiednie do marketingu',
      ad: 'przyciągające uwagę zdjęcie reklamowe, komercyjne, profesjonalne, wysokiej jakości, marketingowe',
    }

    const stylePrompt = imagePrompts[contentType] || imagePrompts.article

    // Stwórz prompt dla DALL-E na podstawie treści
    // Użyj pierwszych 200 znaków treści jako inspiracji
    const contentSummary = contentPrompt.substring(0, 200)
    const imagePrompt = `${contentSummary}. ${stylePrompt}, mistrzowska jakość, profesjonalne oświetlenie, szczegółowe, 4K resolution`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('Nie udało się wygenerować URL zdjęcia')
    }

    return imageUrl
  } catch (error: any) {
    console.error('OpenAI Image Generation Error:', error)
    throw new Error(
      error.message || 'Nie udało się wygenerować zdjęcia. Sprawdź klucz API.'
    )
  }
}

