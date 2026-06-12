const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3000;

const HF_API_KEY = "";

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.post('/api/hf-vision', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing image" });
    }

    const response = await axios.post(
        "https://router.huggingface.co/v1/chat/completions",
        {
          model: "Qwen/Qwen3-VL-8B-Instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analizza l'immagine e rispondi SOLO con un numero da 0 a 100. Nessun altro testo."
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
        },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
    );

    res.json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json(err.response?.data || err.message);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server attivo su http://localhost:${PORT}`);
});