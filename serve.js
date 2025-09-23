import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { converterPDF } from "./converter.js";

const app = express();
const PORT = 3000;

// Token de autenticação
const API_TOKEN = "1234";

// Pastas
const uploadDir = path.join(process.cwd(), "uploads");
const convertedDir = path.join(process.cwd(), "converted");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir, { recursive: true });

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Middleware de autenticação
function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  const token = authHeader.split(" ")[1];
  if (token !== API_TOKEN) return res.status(403).json({ error: "Token inválido" });
  next();
}

// Rota POST para converter PDF
app.post("/converter", autenticar, upload.single("arquivo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo PDF não enviado" });

  const pdfPath = req.file.path;
  const outputFileName = path.parse(req.file.originalname).name + ".html";
  const outputPath = path.join(convertedDir, outputFileName);

  try {
    console.log(`📥 Processando: ${req.file.originalname}`);
    await converterPDF(pdfPath, outputPath);
    
    res.download(outputPath, outputFileName, (err) => {
      // Limpa arquivos temporários
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(outputPath);
      if (err) console.error("Erro enviando o arquivo:", err);
    });
  } catch (err) {
    console.error('❌ Erro na conversão:', err);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    res.status(500).json({ error: "Erro na conversão: " + err.message });
  }
});

// Rota de saúde
app.get("/health", (req, res) => {
  res.json({ 
    status: "online", 
    timestamp: new Date().toISOString(),
    tool: "pdf2htmlEX - Alta Fidelidade"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔧 Conversor: pdf2htmlEX (Alta qualidade)`);
});