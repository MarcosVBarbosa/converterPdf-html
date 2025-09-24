const express = require("express");
const fileUpload = require("express-fileupload");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");


const app = express();
app.use(fileUpload());
app.use(express.static(path.join(__dirname, "output")));


app.post("/convert", (req, res) => {
if (!req.files || !req.files.pdf) return res.status(400).send("Nenhum arquivo enviado");


const pdfFile = req.files.pdf;
const uploadPath = path.join(__dirname, "uploads", pdfFile.name);
const outputDir = path.join(__dirname, "output");


if (!fs.existsSync(path.join(__dirname, "uploads"))) fs.mkdirSync(path.join(__dirname, "uploads"));
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);


pdfFile.mv(uploadPath, (err) => {
if (err) return res.status(500).send(err);


// Converte para HTML usando LibreOffice
exec(`soffice --headless --convert-to html "${uploadPath}" --outdir "${outputDir}"`, (errorHtml) => {
if (errorHtml) return res.status(500).send(errorHtml);


const htmlFile = path.join(outputDir, pdfFile.name.replace(".pdf", ".html"));
res.sendFile(htmlFile);
});
});
});


app.listen(3000, () => console.log("Servidor rodando na porta 3000"));