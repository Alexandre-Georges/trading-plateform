var https = require('https');

var newsService = {
    URL: 'cloud.feedly.com',
    BASE_PATH: '/v3',
    STREAM: 'user%2F7be76130-1791-4670-befa-9aabdc9a4837%2Fcategory%2Ffinance',
    NEWS_NUMBER: 20,
    getHeaders (token) {
        return {
            'Authorization': 'OAuth ' + token
        }
    },
    getNews (token) {
        return new Promise((callback, errorCallback) => {
            try {
                https.get(
                    {
                        hostname: newsService.URL,
                        path: newsService.BASE_PATH + '/streams/' + newsService.STREAM + '/contents?unreadOnly=true&ranked=newest&count=' + newsService.NEWS_NUMBER,
                        headers: newsService.getHeaders(token)
                    }, (response) => {

                        var allData = '';

                        response.on('data', (data) => {
                            allData += data;
                        });
                        response.on('end', () => {
                            var responseData = JSON.parse(allData);
                            if (response.statusCode !== 200) {
                                errorCallback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                                return;
                            }
                            callback(responseData);
                        });

                }).on('error', (error) => {
                    errorCallback({ statusCode: 503, errorMessage: error });
                });
            } catch (exception) {
                errorCallback({ statusCode: 503, errorMessage: exception });
            }
        });
    },
    getUnreadCount (token) {
        return new Promise((callback, errorCallback) => {
            try {
                https.get(
                    {
                        hostname: newsService.URL,
                        path: newsService.BASE_PATH + '/markers/counts?streamId=' + newsService.STREAM,
                        headers: newsService.getHeaders(token)
                    }, (response) => {

                    var allData = '';

                    response.on('data', (data) => {
                        allData += data;
                    });
                    response.on('end', () => {
                        var responseData = JSON.parse(allData);
                        if (response.statusCode !== 200) {
                            errorCallback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                            return;
                        }
                        callback(responseData);
                    });

                }).on('error', (error) => {
                    errorCallback({ statusCode: 503, errorMessage: error });
                });
            } catch (exception) {
                errorCallback({ statusCode: 503, errorMessage: exception });
            }
        });
    },
    readEntries (token, ids) {
        return new Promise((callback, errorCallback) => {
            try {
                var request = https.request(
                    {
                        method: 'POST',
                        hostname: newsService.URL,
                        path: newsService.BASE_PATH + '/markers',
                        headers: newsService.getHeaders(token)
                    }, (response) => {
        
                        var allData = '';
        
                        response.on('data', (data) => {
                            allData += data;
                        });
                        response.on('end', () => {
                            if (response.statusCode !== 200) {
                                var responseData = JSON.parse(allData);
                                errorCallback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                                return;
                            }
                            callback();
                        });
        
                }).on('error', (error) => {
                    errorCallback({ statusCode: 503, errorMessage: error });
                });
                request.write(JSON.stringify({
                    entryIds: ids,
                    action: 'markAsRead',
                    type: 'entries'
                }));
                request.end();
            } catch (exception) {
                errorCallback({ statusCode: 503, errorMessage: exception });
            }
        });
    },
    unreadEntries (token, ids) {
        return new Promise((callback, errorCallback) => {
            try {
                var request = https.request(
                    {
                        method: 'POST',
                        hostname: newsService.URL,
                        path: newsService.BASE_PATH + '/markers',
                        headers: newsService.getHeaders(token)
                    }, (response) => {

                        var allData = '';

                        response.on('data', (data) => {
                            allData += data;
                        });
                        response.on('end', () => {
                            if (response.statusCode !== 200) {
                                var responseData = JSON.parse(allData);
                                errorCallback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                                return;
                            }
                            callback();
                        });

                }).on('error', (error) => {
                    errorCallback({ statusCode: 503, errorMessage: error });
                });
                request.write(JSON.stringify({
                    entryIds: ids,
                    action: 'keepUnread',
                    type: 'entries'
                }));
                request.end();

            } catch (exception) {
                errorCallback({ statusCode: 503, errorMessage: exception });
            }
        });
    }
};
module.exports = newsService;