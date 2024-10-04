const express = require('express');
const { bulkhead } = require('cockatiel');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const app = express();
const port = 8080;

// Configurando bulkhead com cockatiel (Máximo de 2 requisições simultâneas)
const bulkheadPolicy = bulkhead(2);

// Função simulando chamada externa
async function externalService() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Resposta da chamada externa');
        }, 100);  // Simula uma chamada que demora 100 milissegundos
    });
}

// Função para executar a chamada no Worker
function runServiceInWorker(serviceData) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData: serviceData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker finalizado com código de saída ${code}`));
        });
    });
}

// Se o código está rodando dentro de um Worker, executa o serviço
if (!isMainThread) {
    externalService()
        .then((result) => parentPort.postMessage(result))
        .catch((error) => parentPort.postMessage(`Erro: ${error.message}`));
} else {
    // Rota que faz a chamada simulada com bulkhead e logging de threads
    app.get('/api/v1/bulkhead', async (req, res) => {
        try {
            console.log(`Requisição recebida: ${req.url} - Iniciando Worker`);

            // Executa o serviço no worker controlado pelo bulkhead
            const result = await bulkheadPolicy.execute(() => runServiceInWorker(req.url));

            console.log(`Resultado recebido do Worker: ${result}`);
            res.send(result);
        } catch (error) {
            console.error(`Erro: ${error.message}`);
            res.status(500).send(`Erro: ${error.message}`);
        }
    });

    // Iniciando o servidor
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
}
