import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function converterPDF(pdfPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log('🎯 Convertendo com pdf2htmlEX...');
        
        // Configurações para máxima qualidade
        const command = `pdf2htmlEX \
            --zoom 1.3 \
            --font-format woff \
            --embed-css 1 \
            --embed-font 1 \
            --embed-image 1 \
            --embed-javascript 0 \
            --split-pages 0 \
            --dest-dir "${path.dirname(outputPath)}" \
            "${pdfPath}" "${path.basename(outputPath)}"`;

        console.log(`📄 Convertendo: ${path.basename(pdfPath)}`);
        
        exec(command, { timeout: 180000 }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Erro no pdf2htmlEX:', error.message);
                
                // Fallback para pdftohtml
                console.log('🔄 Tentando fallback com pdftohtml...');
                fallbackConversion(pdfPath, outputPath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            console.log('✅ pdf2htmlEX executado com sucesso!');
            
            if (fs.existsSync(outputPath)) {
                console.log(`📁 HTML gerado: ${outputPath}`);
                resolve(outputPath);
            } else {
                // Procura por arquivos HTML no diretório
                const files = fs.readdirSync(path.dirname(outputPath));
                const htmlFiles = files.filter(f => f.endsWith('.html'));
                if (htmlFiles.length > 0) {
                    const foundFile = path.join(path.dirname(outputPath), htmlFiles[0]);
                    console.log(`📁 HTML encontrado: ${foundFile}`);
                    resolve(foundFile);
                } else {
                    reject(new Error('Nenhum arquivo HTML foi gerado'));
                }
            }
        });
    });
}

async function fallbackConversion(pdfPath, outputPath) {
    return new Promise((resolve, reject) => {
        const command = `pdftohtml -i -noframes "${pdfPath}" "${outputPath.replace('.html', '')}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Fallback também falhou: ${error.message}`));
                return;
            }
            
            const generatedFile = outputPath.replace('.html', '') + '.html';
            if (fs.existsSync(generatedFile)) {
                console.log('✅ Fallback pdftohtml funcionou!');
                resolve(generatedFile);
            } else {
                reject(new Error('Fallback: arquivo não gerado'));
            }
        });
    });
}