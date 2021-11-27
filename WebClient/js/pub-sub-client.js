const hubname = 'pub-sub';


class TopicHandler {

    constructor(messageHandler, abortHandler) {
        this.messageHandler = messageHandler;
        this.abortHandler = abortHandler;
    }

    onAbortTopic(topic) {
        if (this.abortHandler != null)
            this.abortHandler(topic);
    }

    onNewMessageTopic(topicName, data) {
        if (this.messageHandler != null)
            this.messageHandler(topicName, data);
    }

}

class PubSubConnection {

    constructor(baseUrl, username) {

        this.topicHandlers = [];
        this.newTopicHandler = null;
        this.disConnectedHandler = null;

        this.baseUrl = normalizeUrl(baseUrl);
        this.hubUrl = this.createHubConnectionUrl(this.baseUrl, username);
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.hubUrl)
            .build();

        this.connection.onclose(err => {
            this.disConnectedHandler(err);
        });
    }

    createHubConnectionUrl(baseUrl, username) {
        baseUrl = `${baseUrl}/${hubname}?username=${username}`;
        return baseUrl;
    }

    async connect() {
        await this.connection.start();

        this.connection.on("onNewMessage", (topicName, message) => {
            var topicHandler = this.topicHandlers[topicName];
            if (topicHandler == null)
                return;
            topicHandler.onNewMessageTopic(topicName, message);
        });

        this.connection.on("onAbortTopic", (topic) => {
            var topicHandler = this.topicHandlers[topic.name];
            if (topicHandler == null)
                return;
            topicHandler.onAbortTopic(topic);
        });


        this.connection.on("onNewTopic", (topic) => {
            if (this.newTopicHandler != null) {
                this.newTopicHandler(topic);
            }
        });
    }

    async reConnect() {
        this.connection.connection.start();
    }

    async createTopic(topicName) {
        await this.connection.invoke("create-topic", topicName, null);
    }

    async subscribe(topic, topicHandler) {
        await this.connection.invoke("subscribe", topic);
        this.topicHandlers[topic] = topicHandler;
    }
    async unSubscribe(topic) {
        await this.connection.invoke("un-subscribe", topic);
    }

    async publish(to, message) {
        await this.connection.invoke("publish", to, message);
    }

    async findTopics(topicName) {
        var url = this.baseUrl + "/api/topic/search?name=" + topicName
        return $.ajax({
            url: url,
            datatype: 'json'
        });
    }

    // --------- set handlers -----------

    async setNewTopicHandler(hanler) {
        this.newTopicHandler = hanler;
    }

    async setDisconnectedHandler(handler) {
        this.disConnectedHandler = handler;
    }
}

function normalizeUrl(baseUrl) {
    if (baseUrl.endsWith('/'))
        baseUrl = baseUrl.slice(0, -1);
    return baseUrl;
}

