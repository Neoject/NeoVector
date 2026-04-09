import { env } from '../config/env';

export class AiService {
    static async generateProductDescription(productName: string): Promise<string> {
        if (!env.deepseekApiKey) {
            throw new Error('DeepSeek API key is not configured');
        }

        const payload = {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'Ты креативный маркетолог премиального бренда аксессуаров для часов. Создавай ёмкие описания (до 3 предложений) с акцентом на материалы, тактильные ощущения и ценность товара.',
                },
                {
                    role: 'user',
                    content: `Сгенерируй продающее описание ремня для часов под названием «${productName}». Сделай текст живым, передай атмосферу роскоши и подчеркни выгоды для владельца.`,
                },
            ],
            temperature: 0.85,
            max_tokens: 320,
        };

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.deepseekApiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            // @ts-ignore
            throw new Error(`AI error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        // @ts-ignore
        return data.choices[0]?.message?.content?.trim() || '';
    }
}