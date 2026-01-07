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

