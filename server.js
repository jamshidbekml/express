const express = require('./express');
const app = express();

app.use(express.json());

app.get('/:id', (req, res) => {
    console.log(req.headers);
    res.status(500).json({
        params: req.params,
        query: req.query,
        message: 'hello',
    });
});

app.post('/', (req, res) => {
    console.log(req.body);
    res.send('hello');
});

app.put('/', (req, res) => {
    res.status(200).json({
        message: 'User updated successfully',
    });
});

app.delete('/', (req, res) => {
    res.status(200).json({
        message: 'User deleted successfully',
    });
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});
