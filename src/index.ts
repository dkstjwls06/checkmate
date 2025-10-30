import express from 'express';
const app = express();

app.use('/public', express.static('./dist/public'));
app.use('/img', express.static('./view/img'));
app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root:'./view'
    });
})

app.listen(80);