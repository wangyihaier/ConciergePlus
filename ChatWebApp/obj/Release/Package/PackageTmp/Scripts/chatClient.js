var socket;
$(document).ready(function () {

    //TODO: Enter your Speech API Key here
    var speechApiKey = "af730e67cfcd44929305df8684fd3000";


    var sessionId = "";
    var isListening = false;
    

    if (!Modernizr.websockets) {
        alert("This browser doesn't support HTML5 Web Sockets!");
        return;
    }


    $("#btnJoin").click(function () {
        var uname = $("#username").val();

        if (uname.length > 0) {
            $("#joinChatPanel").fadeOut();
            $("#chatPanel").fadeIn();
            $("#divHistory").empty();

            openConnection();
        }
        else {
            alert('Please enter a username');
        }
    });

    $("#txtMsg").on("keyup", function (event) {
        if (event.keyCode == 13) {
            $("#btnSend").click();
        }
    });

    $("#btnListen").click(function () {
        if (!isListening)
        {   
            listenToSpeech();
        }
        
    });

    $("#btnSend").click(function () {
        if (socket.readyState == WebSocket.OPEN) {
            sendChatMessage();
        }
        else {
            $("#divHistory").append('<h3>The underlying connection is closed.</h3>');
        }
    });

    $("#btnLeave").click(function () {
        //disconnect from the chat
        socket.close();

        $("#chatPanel").fadeOut();
        $("#joinChatPanel").fadeIn();
        $("#divHistory").empty();
    });


    function openConnection() {
        //Connnect websocket over SSL if host webpage loaded over SSL
        var socketProtocol = location.protocol == "https:" ? "wss:" : "ws:";
        socket = new WebSocket(socketProtocol + "//" + location.host + "/ws");

        socket.addEventListener("open", function (evt) {
            $("#divHistory").append('Connected to the chat service...');
            joinChatSession();
        }, false);

        socket.addEventListener("close", function (evt) {
            $("#divHistory").append('Connection to the chat service was closed. ' + evt.reason);
        }, false);

        socket.addEventListener("message", function (evt) {
            receiveChatMessage(evt.data);
        }, false);

        socket.addEventListener("error", function (evt) {
            alert('Error : ' + evt.message);
        }, false);
    }

    var username = "";

    function joinChatSession() {

        $("#chat-room").text($("#listChatRooms").children(':selected').text());
        sessionId = $("#listChatRooms").val();
        username = $("#username").val();

        var msg = {
            sessionId: sessionId,
            username: username,
            type: "join"
        };

        socket.send(JSON.stringify(msg));
    }

    function sendChatMessage() {

        var username = $("#username").val();
        var messageText = $("#txtMsg").val();

        if (messageText.length > 0) {

            var msg = {
                message: messageText,
                sessionId: sessionId,
                username: username,
                type: "chat"
            };

            socket.send(JSON.stringify(msg));

            $("#txtMsg").val('');
        }
    }

    function receiveChatMessage(jsonMessage)
    {
        var chatMessage = JSON.parse(jsonMessage);

        if (chatMessage.type == "ack") {
            // capture the dynamic session id
            sessionId = chatMessage.sessionId;
        }
        else {
            var chatHistory = $(".chat");
            var htmlChatBubble = "", createDate, initial;
            com.contoso.concierge.addUserIfNeeded(chatMessage.username);
            createDate = new Date(chatMessage.createDate);
            initial = chatMessage.username.substring(0, chatMessage.username.length > 1 ? 2 : 1).toUpperCase();

            if (chatMessage.username != username) {
                htmlChatBubble = '<li class="chatBubbleOtherUser left clearfix"><span class="chat-img pull-left">';
                htmlChatBubble += '<img src="https://placehold.it/50/' + com.contoso.concierge.getAvatarColor(chatMessage.username) + '/fff&text=' + initial + '" alt="' + chatMessage.username + '" class="img-circle" /></span>';
                htmlChatBubble += '<div class="chat-body clearfix"><div class="header">';
                htmlChatBubble += '<strong class="primary-font">' + chatMessage.username + '</strong><small class="pull-right text-muted">';
                htmlChatBubble += '<span class="glyphicon glyphicon-time"></span>&nbsp;' + createDate.toLocaleTimeString() + '</small></div>';
            }
            else {
                htmlChatBubble = '<li class="chatBubbleMe right clearfix"><span class="chat-img pull-right">';
                htmlChatBubble += '<img src="https://placehold.it/50/e5e5e5/fff&text=' + initial + '" alt="' + chatMessage.username + '" class="img-circle" /></span>';
                htmlChatBubble += '<div class="chat-body clearfix"><div class="header"><small class="text-muted">';
                htmlChatBubble += '<span class="glyphicon glyphicon-time"></span>&nbsp;' + createDate.toLocaleTimeString() + '</small>';
                htmlChatBubble += '<strong class="pull-right primary-font">' + chatMessage.username + '</strong></div>';
            }

            if (chatMessage.score) {
                if (chatMessage.score >= 0.5) {
                    htmlChatBubble += '<p><span class="glyphicon glyphicon-thumbs-up"></span>';
                }
                else {
                    htmlChatBubble += '<p><span class="glyphicon glyphicon-thumbs-down"></span>';
                }
            }
            else
            {
                htmlChatBubble += '<p>';
            }

            htmlChatBubble += chatMessage.message + '</p>';
            htmlChatBubble += '</div></li>';

            chatHistory.append(htmlChatBubble);
        }
    }



    var client;
    var request;
    var mode = Microsoft.ProjectOxford.SpeechRecognition.SpeechRecognitionMode.shortPhrase;
    var langauge = "en-us";
    

    function setRecognizedMessageText(text) {
        $("#txtMsg").val(text);
    }

    function initSpeechClient()
    {
        client = Microsoft.ProjectOxford.SpeechRecognition.SpeechRecognitionServiceFactory.createMicrophoneClient(
            mode,
            langauge,
            speechApiKey,
            speechApiKey);
    }

    function listenToSpeech() {
        
        if (!client)
        {
            initSpeechClient();
        }

        console.log("Listening for speech...")
        client.startMicAndRecognition();
        isListening = true;

        $("#btnListen").button('toggle');

        setTimeout(function () {
            $("#btnListen").button('toggle');
            client.endMicAndRecognition();
            isListening = false;
            console.log("Stopped listening for speech.")
        }, 3000);
        
        client.onError = function (errorCode, response) {
            console.log("Received error " + errorCode + " " + response)
        }
        client.onIntentReceived = function (response)
        {
            console.log("Received intent..." + response);
        }
        client.onPartialResponseReceived = function (response) {
            console.log("Received intermediate text from speech: " + response);
            setRecognizedMessageText(response);
        }
        client.onFinalResponseReceived = function (response) {
            console.log("Received text from speech: " + JSON.stringify(response));
            setRecognizedMessageText(response[0].display);
        }
    }


});