export async function handler(event) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/octet-stream"
      },
      body: event.body
    }
  );

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}