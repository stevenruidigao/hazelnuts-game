let deferredPrompt;
var installButton = document.getElementById("installButton");
// console.log(installButton)
window.addEventListener('beforeinstallprompt', (e) => {
	// Prevent Chrome 67 and earlier from automatically showing the prompt
	e.preventDefault();
	// Stash the event so it can be triggered later.
	deferredPrompt = e;
	// Update UI notify the user they can add to home screen
	console.log(e);
	installButton.style.display = 'inline';
});
installButton.addEventListener('click', (e) => {
	// hide our user interface that shows our A2HS button
	installButton.style.display = 'none';
	// Show the prompt
	deferredPrompt.prompt();
	// Wait for the user to respond to the prompt
	deferredPrompt.userChoice
    .then((choiceResult) => {
		if (choiceResult.outcome === 'accepted') {
			console.log('User accepted the A2HS prompt');
		} else {
			console.log('User dismissed the A2HS prompt');
		}
		deferredPrompt = null;
    });
});
var socket = io.connect();
console.log(socket);
socket.on("connected", function(uuid) {
    var id = uuid;
    console.log('Connected successfully to the socket.io server. My server side ID is ' + id);
});
socket.on("joinGame", function (id) {
    window.location.href = "/game/" + id;
})
socket.on("play", function(data) {
    var id = data.id;
    var card = data.card;
    if (document.getElementById(card).style.backgroundImage == 'url("/cards/0000.svg")') {
        document.getElementById(card).style.backgroundImage = "url('/cards/" + card + ".svg')";
    } else {
        document.getElementById(card).style.backgroundImage = "url('/cards/0000.svg')";
    }
});
socket.on("chat", function(message) {
    var messages = document.getElementById("messages");
    var autoScroll = messages.scrollHeight - messages.scrollTop < messages.clientHeight + 17;
    var messageBox = document.createElement("P");
    var text = document.createTextNode(message);
    messageBox.appendChild(text);
    messages.appendChild(messageBox);
    console.log(messages.scrollHeight - messages.scrollTop + " ?= " + messages.clientHeight);
    if (autoScroll) messages.scrollTop = messages.scrollHeight;
    console.log(message);
});
socket.on("gamesList", function(games) {
    games = new Map(games);
    console.log(games);
    var gamesList = document.getElementById("joinGame");
    if (gamesList != null) {
        while (gamesList.firstChild) {
            gamesList.removeChild(gamesList.firstChild);
        }
        for (var id of games.keys()) {
            if (!games.hasOwnProperty(id)) {
                var joinButton = document.createElement("BUTTON");
                var text = document.createTextNode("Join " + games.get(id));
                joinButton.id = id;
                joinButton.onclick = function() {window.location.href = "/game/" + id};
                joinButton.appendChild(text);
                gamesList.appendChild(joinButton)
            }
        }
    }
});
socket.on("host", function (gameID) {
   console.log("Hosting " + gameID); 
});
socket.on("cards", function(hand) {

    // cards = gameData.(socket.id);
    console.log(hand);
    // gameData.sort();
    var cards = document.getElementById("cards");
    while (cards.hasChildNodes()) {
        cards.removeChild(cards.lastChild);
    }
    for (var i = 0; i < hand.length; i ++) {
        var card = document.createElement("div");
        card.id = hand[i];
        card.className = "card";
        card.draggable = true;
        card.onclick = function (e) {
            // console.log(e);
            play(e.target.id);
        };
        card.style.backgroundImage = "url('/cards/" + card.id + ".svg')";
        // console.log(card);
        cards.appendChild(card);
    }
    // for (i = 0; i < cards.childNodes.length; i ++) {
        // console.log(cards.childNodes);
        // cards.removeChild(cards.childNodes[i]);
    // }
    console.log("cleared");
    // console.log(card);
});

var gamePaths = window.location.pathname.split("game/");
if (gamePaths.length == 2) joinGame(gamePaths[1], null);

function loadCookies() {
    if (document.cookie != "" && document.cookie.split("username=").length >= 2) {
        console.log(document.cookie);
        name(document.cookie.split("username=")[1].split(";")[0]);
        hideNamer();
    }
}
function chat(message) {
	if (message.replace(/\s/g, "") != "") {
		socket.emit("chat", message);
	} 
}
function name(name) {
    if (name.replace(/\s/g, "") == "") {
        socket.emit("name", "Anonymous");
        document.cookie = "username=Anonymous";
    } else {
        socket.emit("name", name);
        document.cookie = "username=" + name;
    }
    console.log(document.cookie);
}
function createGame(e) {
    if (e.keyCode == 13 || e == 0) {
        var game = document.getElementById("createGame");
        newGame(game.value, null);
    }
}
function newGame(name, pass) {
    if (name != "") socket.emit("newGame", name, pass);
}
function joinGame(id, pass) {
    socket.emit("joinGame", id, pass);
}
function startGame() {
    socket.emit("startGame");
}
function hideNamer() {
    var username = document.getElementById("username");
    var usernameButton = document.getElementById("usernameButton");
    var chatInput = document.getElementById("chatInput");
    username.hidden = "true";
    usernameButton.hidden = "true";
    chatInput.removeAttribute("hidden");
}
function submitName(e) {
    if (e.keyCode == 13 || e == 0) {
        var username = document.getElementById("username");
        name(username.value);
        hideNamer();
    }
}
function submitChat(e) {
    var message = document.getElementById("chatInput");
    if (e.keyCode == 13 || e == 0) {
        chat(message.value);
        message.value = "";
    }
}
function hideChat() {
    var chatBar = document.getElementById("chatBar");
    var maximize = document.getElementById("maximize");
    chatBar.style.display = "none";
    maximize.removeAttribute("hidden");
}
function closeChat() {
    var chatBar = document.getElementById("chatBar");
    chatBar.style.display = "none";
}
function showChat() {
    var chatBar = document.getElementById("chatBar");
    var maximize = document.getElementById("maximize");
    maximize.setAttributeNode(document.createAttribute("hidden"));
    chatBar.style.display = "block";
}
