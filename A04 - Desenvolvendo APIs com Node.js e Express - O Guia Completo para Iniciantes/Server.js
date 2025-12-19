const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'segredo_muito_secreto';

app.use(express.json());

let tarefas = []; 
const users = [
    { id: 1, username: 'usuario', hashedPassword: bcrypt.hashSync('senha123', 8) } 
];

const autenticar = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ mensagem: 'Token não encontrado. Acesso negado.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ mensagem: 'Formato do Token inválido. Acesso negado.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {

            return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
        }
        
        req.userId = decoded.id;
        next(); 
    });
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.hashedPassword);
    if (!passwordIsValid) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
});


app.get('/', (req, res) => {
    res.send('Bem-vindo à API de Tarefas! Use /login para obter um token e acessar as rotas CRUD.');
});

app.post('/tarefas', autenticar, (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ mensagem: 'O campo "nome" é obrigatório.' });
    }

    const novaTarefa = {
        id: tarefas.length > 0 ? tarefas[tarefas.length - 1].id + 1 : 1, 
        nome,
        concluida: false
    };

    tarefas.push(novaTarefa);
    
    res.status(201).json(novaTarefa);
});


app.get('/tarefas', (req, res) => {
    res.json(tarefas);
});

app.get('/tarefas/:id', (req, res) => {
    const { id } = req.params;
    const tarefa = tarefas.find(t => t.id == id);
    
    if (!tarefa) {
        return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }

    res.json(tarefa);
});

app.put('/tarefas/:id', autenticar, (req, res) => {
    const { id } = req.params;
    const { nome, concluida } = req.body;

    let tarefa = tarefas.find(t => t.id == id);
    if (!tarefa) {
        return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }

    if (nome !== undefined) {
        tarefa.nome = nome;
    }
    if (concluida !== undefined) {
        tarefa.concluida = concluida;
    }
    
    res.json(tarefa);
});

app.delete('/tarefas/:id', autenticar, (req, res) => {
    const { id } = req.params;
    const initialLength = tarefas.length;
    
    tarefas = tarefas.filter(t => t.id != id);

    if (tarefas.length === initialLength) {
         return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }
    
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});