export async function handler(event) {
    try {
        const { image } = JSON.parse(event.body || "{}");

        if (!image) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing image" })
            };
        }

        const response = await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "Qwen/Qwen3-VL-8B-Instruct",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Analizza l'immagine e rispondi SOLO con un numero da 0 a 100."
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: image }
                                }
                            ]
                        }
                    ],
                    max_tokens: 5,
                    temperature: 0.1,
                    top_p: 0.1
                })
            }
        );

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: err.message
            })
        };
    }
}