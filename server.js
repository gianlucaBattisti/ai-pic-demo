const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3000;

const HF_API_KEY = "";

// serve per ricevere il file binario
app.use(cors());
app.use(express.raw({ type: "application/octet-stream", limit: "10mb" }));

app.post("/api/hf-vision", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/microsoft/resnet-50",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("Errore HF:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server attivo su http://localhost:${PORT}`);
});