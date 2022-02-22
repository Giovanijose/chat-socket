var app = require('http').createServer(resposta);
var fs = require('fs');
var io = require('socket.io')(app);

messages = [];
users = [];

app.listen(3000);
console.log("Aplicação iniciada");

function resposta(req, res) {
    var arquivo = "";
    if (req.url == "/") {
        arquivo = __dirname + '/index.html';
    } else {
        arquivo = __dirname + req.url;
    }
    fs.readFile(arquivo,
        function (err, data) {
            if (err) {
                res.writeHead(404);
                return res.end('Página ou arquivo não encontrados');
            }

            res.writeHead(200);
            res.end(data);
        }
    );
}

io.on("connection", (socket) => {

    // Evento de enviar mensagens  
    socket.on('send-message', (message, callback) => {

        const objMessage = {
            message, date: getActualDate(),
            type: 'message', user: socket.user,
            color: socket.color
        };
        messages.push(objMessage);
        io.sockets.emit('update-message', objMessage);
        callback();
    });

    // Evento ao entrar no chat
    socket.on('enter', (user, callback) => {
        socket.user = user;
        socket.color = getRandomColor();
        users[user] = socket;

        messages.forEach(m => {
            socket.emit('update-message', m);
        });

        const objMessage = {
            message: 'entrou na sala', date: getActualDate(),
            type: 'enter', user: socket.user
        };
        messages.push(objMessage);

        io.sockets.emit('update-message', objMessage);

        io.sockets.emit('update-users', Object.keys(users));

        callback();
    });

    // Evento ao desconectar-se do socket
    socket.on("disconnect", () => {

        if(socket.user){

            const objMessage = {
                message: 'saiu da sala', date: getActualDate(),
                type: 'enter', user: socket.user
            };
            messages.push(objMessage);
            
            io.sockets.emit('update-message', objMessage);
            
            delete users[socket.user];
            io.sockets.emit('update-users', Object.keys(users));
        }

    });

});

function getActualDate() {
    const date = new Date();
    return dateStr =
        ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
        ("00" + date.getDate()).slice(-2) + "/" +
        date.getFullYear() + " " +
        ("00" + date.getHours()).slice(-2) + ":" +
        ("00" + date.getMinutes()).slice(-2)
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}