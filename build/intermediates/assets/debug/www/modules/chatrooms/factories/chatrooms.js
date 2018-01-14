App.factory('Chatrooms', function (_, $cordovaLocalNotification, $filter, $rootScope, $state, $http, $ionicPlatform, Url, $q, $window, $timeout, Application, Customer, AUTH_EVENTS) {
    var CHATROOM_LOCAL_NOTIFICATION_ID = 100;

    var factory = {};

    factory.value_id = null;
    factory.SocketIO_Port = null;
    factory.nickname = null;

    factory.CONNECT_EVENT = "chatrooms:connect_event";
    factory.DISCONNECT_EVENT = "chatrooms:disconnect_event";
    factory.UPDATED_FRIENDLIST_EVENT = "chatrooms:updated_friendlist_event";

    var _private_chatrooms = JSON.parse($window.localStorage.getItem("sb-private-chatrooms"));

    var _notifications_settings = {};

    Object.defineProperty(factory, "private_chatrooms", {
        get: function() {
            return _.values(_private_chatrooms);
        }
    });

    factory.getChatrooms = function () {
        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        return $http({
            method: 'GET',
            url: Url.get("chatrooms/mobile_view/chatrooms", {
                value_id: this.value_id
            }),
            cache: !($rootScope.isOverview),
            responseType: 'json'
        });
    };

    factory.getInfos = function () {
        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        return $http({
            method: 'GET',
            url: Url.get("chatrooms/mobile_view/infos", {
                value_id: this.value_id
            }),
            cache: false,
            responseType: 'json'
        });
    };

    factory.getFriends = function () {
        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        return $http({
            method: 'GET',
            url: Url.get("chatrooms/mobile_view/friends", {
                value_id: this.value_id
            }),
            cache: false,
            responseType: 'json'
        });
    };

    factory.find = function (receiver_id, private_chat) {
        if(!factory.value_id || !receiver_id) {
            return $q.reject("Unknown application or chatroom");
        }

        var transforms = $http.defaults.transformResponse;

        transforms = angular.isArray(transforms) ? transforms : [transforms];

        transforms.push(function(data) {
            if(angular.isObject(data) && angular.isArray(data.messages)) {
                angular.forEach(data.messages, function(msg, messageIndex) {
                    if(!msg.decoded) {
                        msg.message = Base64.decode(msg.message);
                        msg.decoded = true;
                    }
                });
            }
            return data;
        });

        return $http({
            method: 'GET',
            url: Url.get("chatrooms/mobile_view/find", {
                value_id: this.value_id,
                receiver_id: Base64.encode(encodeURIComponent(receiver_id)),
                private_chat: (private_chat === true)
            }),
            cache: false,
            responseType: 'json',
            transformResponse: transforms
        });
    };

    // Socket.IO
    var _socket = null;
    var _callbacks = {};
    var _userlist_callbacks = {};
    var _rooms = [];
    var _blocked_users = [];
    var _buddies = [];
    var _buddies_callbacks = [];
    var _watchedCustomers = {};
    var __sentPush = 0;
    var __lastPush = 0;
    var __rooms_unread = [];
    var __away_rooms = [];
    var __is_in_background = false;
    var __sentPushMessageIDs = [];

    $ionicPlatform.on('resume', function(result) {
        __is_in_background = false;
        __sentPush = 0;
        __lastPush = 0;
        if((ionic.Platform.isAndroid() || ionic.Platform.isIOS()) && (typeof $cordovaLocalNotification !== "undefined")) {
            $cordovaLocalNotification.cancel([CHATROOM_LOCAL_NOTIFICATION_ID]);
        }
    });

    $ionicPlatform.on('pause', function(result) {
        __is_in_background = true;
        __sentPush = 0;
        __lastPush = 0;
    });

    $rootScope.$on('$cordovaLocalNotification:click', function(event, notification, state) {
        if(!!_.get(notification, "data.chatrooms")) {
            $state.go("chatrooms-list", {value_id: factory.value_id});
        }
    });

    var $socket = function() {
        if(angular.isObject(_socket) && _socket.disconnected === true && !(_socket.reconnecting || _socket.connecting)) {
            try {
                _socket.disconnect();
            } catch (e) {
                console.error(e);
            }
            _socket = null;
        }

        if(_socket === null) {
            _socket = new io.connect(DOMAIN+":"+factory.SocketIO_Port+"/chatrooms", {
                'reconnection': true,
                'reconnectionDelay': 1000,
                'reconnectionDelayMax' : 5000,
                'reconnectionAttempts': 30
            });
            _bindListeners();
        }

        return _socket;
    };

    factory.connected = false;

    var __had_init = false;

    factory.init = function() {
        if(__had_init)
            return;

        function loggedIn() {
            factory.goOnline();
            $rootScope.$broadcast(factory.UPDATED_FRIENDLIST_EVENT);

            var rooms_to_watch = [];
            $q.all([
                $q(function(res, rej) { // $q wrapper are REQUIRED to prevent $q.all to resolve before all promises
                    factory.getFriends().success(function(data) {
                        _.forEach(_.get(data, "friends"), function(f) {
                            rooms_to_watch.push(f.room);
                            _notifications_settings[f.room] = f.notifications;
                        });
                        var blocked = _.get(data, "blocked");
                        if(_.isArray(blocked)) _blocked_users = _.map(blocked, "id");
                        res();
                    }).error(rej);
                }),
                $q(function(res, rej) {
                    factory.getChatrooms().success(function(data) {
                        _.forEach(_.get(data, "chatrooms"), function(f) {
                            rooms_to_watch.push(f.room);
                            _notifications_settings[f.room] = f.notifications;
                        });
                        res();
                    }).error(rej);
                }),
                $q(function(res, rej) {
                    var promises = [];

                    _.forEach(factory.private_chatrooms, function(chatroom) {
                        promises.push(
                            factory.find(chatroom.id, false).success(function(data) {
                                if(_.isObject(data) && _.isObject(data.chatroom)) {
                                    rooms_to_watch.push(data.room);
                                    _notifications_settings[data.room] = data.notifications;
                                }
                            })
                        );
                    });

                    return res(promises.length ? $q.all(promises) : undefined);
                })
            ]).then(function() {
                if(rooms_to_watch.length) factory.handleAwayForRooms(rooms_to_watch);
            });
        }

        function loggedOut() {
            factory.goOffline();
            $rootScope.$broadcast(factory.UPDATED_FRIENDLIST_EVENT);
            factory.handleAwayForRooms([]);
        }

        $rootScope.$on(AUTH_EVENTS.loginSuccess, loggedIn);
        $rootScope.$on(AUTH_EVENTS.logoutSuccess, loggedOut);

        factory.getInfos().success(function(data) {
            factory.SocketIO_Port = data.socket_io_port;
            if(Customer.isLoggedIn()) {
                loggedIn();
            } else {
                loggedOut();
            }
        });

        __had_init = true;
    };

    var _bindListeners = function() {
        var filter_callbacks = function (callbacks, payload) {
            if(angular.isObject(payload) && angular.isString(payload.room)) {
                if(angular.isArray(callbacks[payload.room])) {
                    angular.forEach(callbacks[payload.room], function(callback) {
                        $timeout(callback.bind(null, payload));
                    });
                }
            }
        };

        var process_message = filter_callbacks.bind(this, _callbacks);
        var update_userlist = filter_callbacks.bind(this, _userlist_callbacks);

        _socket.on('userlist', update_userlist);
        _socket.on('msg', process_message);
        _socket.on('privmsg', process_message);

        _socket.on('customer_status_update', function (payload) {
            if(angular.isObject(payload) && angular.isNumber(payload.id)) {
                if(_buddies.indexOf(payload.id) >= 0) {
                    angular.forEach(_buddies_callbacks, function(callback) {
                        $timeout(callback.bind(null, payload));
                    });
                }
                if(angular.isObject(_watchedCustomers[payload.id])) {
                    angular.forEach(_watchedCustomers[payload.id], function(callback) {
                        $timeout(callback.bind(null, payload));
                    });
                }
            }
        });

        _socket.on('buddy_list_update', function() {
            $rootScope.$broadcast(factory.UPDATED_FRIENDLIST_EVENT);
            factory.getFriends().success(function(data) {
                var blocked = _.get(data, "blocked");
                if(_.isArray(blocked)) _blocked_users = _.map(blocked, "id");
            });
        });

        var onConnect = function() {
            factory.connected = true;
            $rootScope.$broadcast(factory.CONNECT_EVENT);
            factory.goOnline();
            angular.forEach(_rooms, factory.joinRoom);
            angular.forEach(_buddies, factory.addBuddyToWatchList);
            angular.forEach(_watchedCustomers, function(o, key) {
                if(+key > 0) {
                    _watchCustomer(key);
                }
            });
        };

        var onDisconnect = function() {
            factory.connected = false;
            $rootScope.$broadcast(factory.DISCONNECT_EVENT);
        };

        _socket.on("connect", onConnect);
        _socket.on("reconnect", onConnect);
        _socket.on("disconnect", onDisconnect);
        _socket.on("reconnect_failed", onDisconnect);
    };

    var payload = function(payload) {
        if(!angular.isObject(payload))
            payload = {};

        /** @todo replace $window.localStorage.getItem("sb-auth-token") with $session.getId() asap cf 4.12.0. */

        return angular.extend({}, {
            sessionID: $window.localStorage.getItem("sb-auth-token"),
            appID: Application.app_id,
            valueID: factory.value_id
        }, payload);
    };


    factory.goOnline = function() {
        $socket().emit("online", payload());

        return $q.resolve();
    };

    factory.goOffline = function() {
        if(_socket !== null) {
            $socket().close();
            _socket = null;
        }
        _callbacks = {};
        _rooms = [];
        _buddies = [];
        _buddies_callbacks = [];
        _watchedCustomers = {};
        __sentPush = 0;
        __lastPush = 0;
        __rooms_unread = [];
        __away_rooms = [];
        _blocked_users = [];
    };

    factory.setNickname = function(new_nickname) {
        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        var request = $http.postForm(
            Url.get("chatrooms/mobile_view/setnickname", {
                value_id: this.value_id
            }),
            { nickname: new_nickname },
            { cache: false } // Never cache this
        );

        request.success(function(result) {
            if(angular.isObject(result) && result.ok === true) {
                factory.goOnline();
                factory.nickname = new_nickname;
            }
            return $q.resolve.apply(this, arguments);
        });

        return request;
    };

    factory.updateNotificationsSettings = function(notifications, receiver_id, private_chat) {
        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        var request = $http.postForm(
            Url.get("chatrooms/mobile_view/setnotificationssettings", {
                value_id: this.value_id
            }),
            { notifications: notifications, receiver_id: receiver_id, private_chat: (private_chat === true) },
            { cache: false } // Never cache this
        );

        request.success(function(data) {
            if(_.isObject(data) && data.ok === true) {
                _notifications_settings[data.room] = notifications;
            }
        });

        return request;
    };

    factory.getCustomerInfos = function(query) {
        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        return $http({
            method: 'GET',
            url: Url.get("chatrooms/mobile_view/getcustomerinfos", {
                value_id: this.value_id,
                query: query
            }),
            cache: false, // Never cache this
            responseType: 'json'
        });
    };

    // Friendships
    // This generate addBuddy, removeBuddy, blockBuddy, and unblockBuddy functions

    angular.forEach({
        addBuddy: "addbuddy",
        removeBuddy: "removebuddy",
        blockBuddy: "blockbuddy",
        unblockBuddy: "unblockbuddy",
    }, function(php_method, js_method) {
        factory[js_method] = function(customer_id) {
            if(!factory.value_id) {
                return $q.reject("Unknown application");
            }

            return $http.postForm(
                Url.get("chatrooms/mobile_view/"+php_method, {
                    value_id: this.value_id
                }),
                { customer_id: customer_id },
                { cache: false } // Never cache this
            ).success(function(data) {
                if(angular.isObject(data) && data.ok === true) {
                    $socket().emit("buddy_list_update", payload({
                        customer_id: +customer_id
                    }));
                }
            });
        };
    });

    var _watchCustomer = function(customer_id) {
        $socket().emit('watch_customer', payload({
            customer_id: +customer_id
        }));
    };

    var _unwatchCustomer = function(customer_id) {
        $socket().emit('unwatch_customer', payload({
            customer_id: +customer_id
        }));
    };

    factory.addBuddyToWatchList = function(buddy_id) {
        if(angular.isNumber(+buddy_id) && (+buddy_id) > 0) {
            _watchCustomer(+buddy_id);

            if(_buddies.indexOf(+buddy_id) < 0)
                _buddies.push(+buddy_id);
        }
    };

    factory.setBuddiesToWatchList = function(buddies) {
        if(angular.isArray(buddies)) {
            angular.forEach(_buddies, _unwatchCustomer);
            angular.forEach(buddies, function(buddy) {
                var buddy_id = null;

                if(angular.isObject(buddy))
                    buddy_id = +buddy.id;
                else if(angular.isNumber(+buddy))
                    buddy_id = +buddy;

                if(angular.isNumber(buddy_id) && buddy_id > 0) {
                    factory.addBuddyToWatchList(buddy_id);
                }
            });
        }
    };

    factory.watchCustomer = function(customer_id, callback) {
        customer_id = +customer_id;

        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        if(!angular.isNumber(customer_id) || (customer_id) < 1) {
            return $q.reject("Unknown ");
        }

        if(!angular.isFunction(callback)) {
            return $q.reject("callback must be a function");
        }

        if(!angular.isObject(_watchedCustomers))
            _watchedCustomers = {};

        if(!angular.isObject(_watchedCustomers[customer_id]))
            _watchedCustomers[customer_id] = {};

        var random_id = Math.round(Math.random()*(new Date()*Math.random()*customer_id));

        _watchedCustomers[customer_id][random_id] = callback;
        _watchCustomer(customer_id);

        return $q.resolve(function removeCallback() {
            if(angular.isObject(_watchedCustomers)) {
                if(angular.isObject(_watchedCustomers[customer_id])) {
                    _watchedCustomers[customer_id][random_id] = undefined;
                    delete _watchedCustomers[customer_id][random_id];

                    if(Object.keys(_watchedCustomers[customer_id]).length < 1) {
                        _unwatchCustomer(customer_id);
                        _watchedCustomers[customer_id] = undefined;
                        delete _watchedCustomers[customer_id];
                    }
                } else {
                    _unwatchCustomer(customer_id); // Just in case
                }
            }
        });
    };

    factory.sendMessage = function(receiver, message, private_chat) {
        private_chat = (private_chat === true);
        receiver = receiver;

        if(!factory.value_id || !receiver) {
            return $q.reject("Unknown application or chatroom");
        }

        $socket().emit(private_chat ? 'sendprivmsg' : 'sendmsg', payload({
            receiver_id: receiver,
            sender_avatar: Customer.getAvatarUrl(Customer.id),
            message: message
        }));

        return $q.resolve();
    };

    factory.sendPicture = function(receiver, image, private_chat) {
        if(!factory.value_id || !angular.isString(receiver) || receiver.length < 1) {
            return $q.reject("Unknown application or chatroom");
        }

        var q = $q.defer();

        $http.postForm(
            Url.get("chatrooms/mobile_view/uploadimage", {
                value_id: this.value_id
            }),
            { image: image },
            { cache: false } // Never cache this
        ).success(function(data) {
            if(angular.isObject(data) && data.ok === true && angular.isString(data.url) && data.url.length > 0) {
                $socket().emit(private_chat ? 'sendprivmsg' : 'sendmsg', payload({
                    receiver_id: receiver,
                    image: data.url
                }));
                q.resolve(true);
            }
        }).error(q.resolve);

        return q.promise;
    };

    factory.joinRoom = function(room) {
        if(!factory.value_id || !angular.isString(room) || room.length < 1) {
            return $q.reject("Unknown application or chatroom");
        }

        $socket().emit('join_room', payload({
            room: room
        }));

        if(_rooms.indexOf(room) < 0)
            _rooms.push(room);

        return $q.resolve();
    };

    function _save_private_chatrooms() {
        if(!angular.isObject(_private_chatrooms))
            _private_chatrooms = {};

        $window.localStorage.setItem("sb-private-chatrooms", JSON.stringify(_private_chatrooms));
    }

    factory.savePrivateChatroom = function(room_id, room_infos) {
        if(!angular.isObject(_private_chatrooms))
            _private_chatrooms = {};

        _private_chatrooms[room_id] = room_infos;
        _save_private_chatrooms();
    };

    factory.leaveRoom = function(room, chatroom_id, recipient_id) {
        if(!factory.value_id || !angular.isString(room) || room.length < 1) {
            return $q.reject("Unknown application or chatroom");
        }

        $socket().emit('leave_room', payload({
            room: room,
            chatroom_id: chatroom_id,
            recipient_id: recipient_id
        }));

        var room_index = _rooms.indexOf(room);
        if(room_index >= 0)
            _rooms.splice(room_index, 1);

        if(!angular.isObject(_private_chatrooms))
            _private_chatrooms = {};

        // Delete just in case it's a private chatroom
        _private_chatrooms[room] = undefined;
        delete _private_chatrooms[room];
        _save_private_chatrooms();

        factory.handleAwayForRooms(_.without(__away_rooms, room));

        return $q.resolve();
    };

    factory.onMessageFrom = function(room, callback) {
        if(!factory.value_id || !angular.isString(room) || room.length < 1) {
            return $q.reject("Unknown application or chatroom");
        }

        if(!angular.isFunction(callback)) {
            return $q.reject("callback must be a function");
        }

        _callbacks[room] = _callbacks[room] || [];
        _callbacks[room].push(callback);

        return $q.resolve();
    };

    factory.onRoomUserListUpdate = function(room, callback) {
        if(!factory.value_id || !angular.isString(room) || room.length < 1) {
            return $q.reject("Unknown application or chatroom");
        }

        if(!angular.isFunction(callback)) {
            return $q.reject("callback must be a function");
        }

        _userlist_callbacks[room] = _userlist_callbacks[room] || [];
        _userlist_callbacks[room].push(callback);

        return $q.resolve();
    };

    factory.markRoomAsRead = function(room) {
        __rooms_unread[room] = [];
    };

    factory.unreadCountForRoom = function(room) {
        __rooms_unread[room] = __rooms_unread[room] || [];
        return __rooms_unread[room].length;
    }

    factory.handleAwayForRooms = function(rooms) {
        if(!factory.value_id || !angular.isArray(rooms)) {
            return $q.reject("Unknown application or rooms is not an array");
        }

        var handle_away = function(data) {
            if(data.senderID != Customer.id) {
                __rooms_unread[data.room] = __rooms_unread[data.room] || [];
                __rooms_unread[data.room].push(data);
                __rooms_unread[data.room] = _.uniq(__rooms_unread[data.room]);
                if(__is_in_background) {
                    var should_notify_message = false;

                    if(!_.includes(_blocked_users, data.senderID)) {
                        if(_.get(_notifications_settings, "["+data.room+"].all", /^privroom:/.test(data.room))) {
                            should_notify_message = true;
                        } else if(_.get(_notifications_settings, "["+data.room+"].mentions", /^room:/.test(data.room))) {
                            var mentioned = new RegExp("\\b@?"+factory.nickname+"\\b", "gi");
                            if(!!(data.message.match(mentioned))) { // DO NOT USE test instead of match, doesn't work on node I don't know why
                                should_notify_message = true;
                            }
                        }
                    }

                    if((__lastPush+(15*60*1000)) < (+new Date())) { // reset sent push number after 15 minutes
                        __sentPush = 0;
                    }

                    if(should_notify_message && __sentPush < 5 && !_.includes(__sentPushMessageIDs, data.id)) {
                        __sentPushMessageIDs.push(data.id);
                        __sentPush++;
                        __lastPush = +(new Date());

                        var params = {
                            id: CHATROOM_LOCAL_NOTIFICATION_ID, // why not
                            data: {
                                chatrooms: true,
                                cover: Customer.getAvatarUrl(data.senderID)
                            }
                        };

                        if(ionic.Platform.isIOS()) {
                            params.title = data.nickname + ": " + $filter('emojify')(data.message);
                        } else {
                            params.title = data.nickname;
                            params.text = $filter('emojify')(data.message);
                        }

                        if(ionic.Platform.isAndroid())
                            params.icon = "res://icon.png";

                        params.data = { chatrooms: true };

                        // Send Local Notification
                        if(typeof $cordovaLocalNotification !== "undefined") {
                            $cordovaLocalNotification.schedule(params);
                        }


                    }
                }
            }
        };

        // Unregister old listeners
        angular.forEach(__away_rooms, function(room) {
            if(angular.isArray(_callbacks[room])) {
                var index = _callbacks[room].indexOf(handle_away);
                while (index > -1) {
                    _callbacks[room].splice(index, 1);
                    index = _callbacks[room].indexOf(handle_away);
                }
            }
        });

        __away_rooms = rooms;

        angular.forEach(__away_rooms, function(room) {
            factory.onMessageFrom(room, handle_away);
            factory.joinRoom(room);
        });
    };

    factory.onBuddiesStatusChange = function(callback) {
        if(!factory.value_id) {
            return $q.reject("Unknown application");
        }

        if(!angular.isFunction(callback)) {
            return $q.reject("callback must be a function");
        }

        _buddies_callbacks = _buddies_callbacks || [];
        _buddies_callbacks.push(callback);

        return $q.resolve();
    };

    return factory;
}).run(function(_, Application, Chatrooms, HomepageLayout) {
    Application.loaded.then(function () {
        HomepageLayout.getActiveOptions().then(function (features) {
            var feature = _.find(features, {code: "chatrooms"});
            if(_.isObject(feature) && _.isNumber(+feature.value_id)) {
                Chatrooms.value_id = +feature.value_id
                Chatrooms.init();
            }
        });
    });
});
