App.config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider.state('chatrooms-list', {
        url: BASE_PATH + "/chatrooms/mobile_view/index/value_id/:value_id",
        controller: 'ChatroomsListViewController',
        templateUrl: "modules/chatrooms/templates/l1/list.html"
    }).state('chatrooms-room', {
        url: BASE_PATH + "/chatrooms/mobile_view/index/value_id/:value_id/:type/:receiver_id",
        params: {
            type: {
                value: "chatroom"
            }
        },
        controller: 'ChatroomsRoomViewController',
        templateUrl: function(param) {
            var layout_id = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
            switch(layout_id) {
                case "1": layout_id = "l1"; break;
                case "2": layout_id = "l2"; break;
                default: layout_id = "l1";
            }
            return "modules/chatrooms/templates/"+layout_id+"/view.html";
        }
    });

}).controller('ChatroomBaseController', function($ionicModal, $ionicPopup, Dialog, $q, $rootScope, $scope, $stateParams, $timeout, $translate, Chatrooms, Customer, AUTH_EVENTS) {

    $scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline) {
            Chatrooms.goOnline();
            $scope.loadContent();
        }
    });

    function setIsConnected() {
        // $timeout force update
        $timeout(function() {
            $scope.isConnectedToChat = Chatrooms.connected;
        });
    }

    $scope.$on(Chatrooms.CONNECT_EVENT, setIsConnected);
    $scope.$on(Chatrooms.DISCONNECT_EVENT, setIsConnected);
    setIsConnected();

    $scope.$on(AUTH_EVENTS.loginSuccess, function() {
        $scope.is_logged_in = true;
        $scope._updateUserStatus();
        $scope.loadContent();
    });
    $scope.$on(AUTH_EVENTS.logoutSuccess, function() {
        $scope.is_logged_in = false;
        $scope._updateUserStatus();
        $scope.loadContent();
    });

    $scope.is_logged_in = Customer.isLoggedIn();


    $scope.is_loading = true;
    $scope.value_id = Chatrooms.value_id = $stateParams.value_id;
    Chatrooms.init();

    $scope.nickname = Chatrooms.nickname;
    $scope.no_nickname = function() { return !Customer.isLoggedIn() || (!angular.isString(Chatrooms.nickname) || Chatrooms.nickname.trim() === ""); };

    $scope._focus_input = function(input_id) {
        input = document.getElementById(input_id);
        if(input)
            $timeout(function () {
                input.focus();
            }, 100);
    };

    $scope._focus_chat_input = function() {
        $scope._focus_input("chat_message_input");
    };

    $scope._blur_chat_input = function() {
        input = document.getElementById("chat_message_input");
        if(input)
            $timeout(function () {
                input.blur();
            }, 100);
    };

    $scope._updateUserStatus = function() {
        $scope.nickname = Chatrooms.nickname;
        $scope.is_logged_in = Customer.isLoggedIn();
        return true; // for chaining
    };

    $scope.closeModal = function(save, new_nickname, new_notifications) {
        if(angular.isObject($scope.infosModal)) {
            if(save === true) {
                if (angular.isString(new_nickname)) {
                    var nickname_changed = false;
                    $scope.is_saving = true;
                    $scope.nickname_error = {};
                    Chatrooms.setNickname(new_nickname).success(function(data) {
                        if(data.ok === true) {
                            nickname_changed = true;
                        } else {
                            $scope.nickname_error = angular.extend({}, data.errors);
                        }
                    }).finally(function() {
                        if(nickname_changed) {
                            $scope.nickname = Chatrooms.nickname;
                            $scope._updateUserStatus();

                            var finish = function() {
                                $scope.infosModal.hide();
                                $scope._focus_chat_input();
                                $scope.is_saving = false;
                            };

                            var orig_n = {}, new_n = {};
                            if(_.isObject(new_notifications)) {
                              if(new_notifications.choice === "all") {
                                  new_notifications.all = new_notifications.mentions = true;
                                  new_notifications.none = false;
                              } else if(new_notifications.choice === "mentions") {
                                  new_notifications.all = new_notifications.none = false;
                                  new_notifications.mentions = true;
                              } else if (new_notifications.choice === "none") {
                                  new_notifications.all = new_notifications.mentions = false;
                                  new_notifications.none = true;
                              }

                              orig_n = _.flatten(_.toPairs(_.omit($scope.notifications, "choice"))).join();
                              new_n = _.flatten(_.toPairs(_.omit(new_notifications, "choice"))).join();
                            }

                            if(orig_n === new_n) {
                                finish();
                            } else {
                                Chatrooms
                                    .updateNotificationsSettings(new_notifications, $scope.receiver_id, $scope.private_chat)
                                    .success(function() {
                                        $scope.notifications = new_notifications;
                                    })
                                    .finally(finish);
                            }
                        } else {
                            $scope.is_saving = false;
                        }
                    });
                } else { // If new_nickname is not a string, we have an error in form (too long, too short)
                    return;
                }
            } else {
                $scope.infosModal.hide();
                $scope._focus_chat_input();
            }
        }
    };

    $scope.showInfos = function(focus_nickname_input) {
        (focus_nickname_input ? $scope.loginIfNeeded() : $q.resolve()).then(function() {
            $scope.new_nickname = $scope.nickname;
            if($scope.notifications) {
                $scope.new_notifications = _.merge({
                    choice: $scope.notifications.all ? "all" : $scope.notifications.mentions ? "mentions" : "none"
                }, $scope.notifications);
            }

            $scope.nickname_error = {};
            $scope._updateUserStatus();

            var __showModal = function() {
                var showed = $scope.infosModal.show();
                if (focus_nickname_input) {
                    showed.then($scope._focus_input.bind(this, "nickname_input"));
                }
            };

            if(!$scope.infosModal) {
                $ionicModal.fromTemplateUrl('modules/chatrooms/templates/l1/modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.infosModal = modal;
                    __showModal();
                });
            } else {
                __showModal();
            }
        });
    };

    // Cleanup the modal when we're done with it!
    function cleanUpModal() {
        if($scope.infosModal) {
            var remove = $scope.infosModal.remove;
            $scope.infosModal = null;
            try { remove(); } catch(e) {}
        }
    }

    $scope.$on('$destroy', cleanUpModal);
    $scope.$on('modal.hidden', function(e, modal) {
        if(modal == $scope.infosModal) {
            cleanUpModal();
        } else if(modal == $scope.profileModal) {
            if(angular.isFunction($scope.delProfileDataListener))
                $scope.delProfileDataListener();

            $scope.profile_data = null;
            $scope.profile_avatar = null;
            $scope.profile_loading = false;
        } else {
//            try { modal.remove(); } catch(ex) {}
        }
    });

    $scope.chooseNicknameIfNeeded = function() {
        $scope._updateUserStatus();
        if(!Customer.isLoggedIn() || !angular.isString(Chatrooms.nickname) || Chatrooms.nickname.trim().length < 1) {
            if($rootScope.isOverview) {
                $rootScope.showMobileFeatureOnlyError();
                return $q.reject();
            }

            if(!Customer.isLoggedIn()) {
                $scope.login();
            } else {
                $scope.showInfos(true);
            }
            return $q.reject();
        }
        return $q.resolve();
    };

    $scope.loginIfNeeded = function() {
        $scope._updateUserStatus();
        if(!$scope.is_logged_in) {
            $scope.login();
            return $q.reject();
        }
        return $q.resolve();
    };

    $scope.login = function() {
        if($rootScope.isOverview) {
            $rootScope.showMobileFeatureOnlyError();
            return;
        }

        Customer.loginModal($scope);
    };

    var _managing_friends = false;


    $scope.closeFriendsModal = function() {
        if(angular.isObject($scope.friendsModal) &&
            angular.isFunction($scope.friendsModal.remove)) {
            $scope.friendsModal.remove();
        }
    };

    $scope.manageFriends = function() {
        $scope.chooseNicknameIfNeeded().then(function() {
            if(_managing_friends)
                return;

            _managing_friends = true;

            $ionicModal.fromTemplateUrl('modules/chatrooms/templates/l1/friendships.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.friendsModal = modal;
                $scope.friendsModal.show().finally(function() {
                    _managing_friends = false;
                });
            });
        });
    };

    var _showingCustomer = false;

    // For adding, blocking or unblocking
    $scope.showCustomer = function(query) {
        if(_showingCustomer)
            return;

        _showingCustomer = true;
        // Some constants
        var CUSTOMER_FRIEND = "friend";
        var CUSTOMER_UNFRIEND = "unfriend";
        var CUSTOMER_BLOCK = "block";
        var CUSTOMER_UNBLOCK = "unblock";

        $scope.chooseNicknameIfNeeded().then(function() {
            $scope.profile_loading = true;
            Chatrooms.getCustomerInfos(query).success(function(data) {
                if(angular.isObject(data)) {
                    if(data.is_you) {
                        $ionicPopup.alert({
                            title: $translate.instant("Hey"),
                            cssClass: "chatrooms",
                            template: $translate.instant("It's you!")
                        });
                    } else {
                        if(angular.isObject(data.customer)) {
                            $scope.profile_loading = false;

                            $scope.profile_avatar = $scope.customer_avatar(data.customer);
                            $scope.profile_customer = data.customer;
                            $scope.profile_data = data;

                            $scope.actionProfile = function(action) {
                                var verb = null,
                                    method = null;

                                switch (action) {
                                    case CUSTOMER_FRIEND:
                                        verb = "adding";
                                        method = "addBuddy";
                                        break;
                                    case CUSTOMER_UNFRIEND:
                                        verb = "removing";
                                        method = "removeBuddy";
                                        break;
                                    case CUSTOMER_BLOCK:
                                        verb = "blocking";
                                        method = "blockBuddy";
                                        break;
                                    case CUSTOMER_UNBLOCK:
                                        verb = "unblocking";
                                        method = "unblockBuddy";
                                        break;
                                }

                                var updateProfileData = function() {
                                    $scope.profile_loading = true;
                                    Chatrooms.getCustomerInfos(query).success(function(data) {
                                        $timeout(function() {
                                            $scope.profile_loading = false;
                                            $scope.profile_data = data;
                                        });
                                    });
                                };

                                $scope.delProfileDataListener = $scope.$on(Chatrooms.UPDATED_FRIENDLIST_EVENT, updateProfileData);

                                if(verb !== null && method !== null) {

                                    Chatrooms[method](data.customer.id).success(function(data) {
                                        updateProfileData();
                                        if(angular.isObject(data) && data.ok === true) {
                                            $scope.loadContent();
                                        } else {
                                            console.error("Error "+verb+" buddy : ", arguments);
                                        }
                                    }).error(function() {
                                        console.error("Error "+verb+" buddy : ", arguments);
                                    });
                                }
                            };

                            /** Show user profile */
                            var __showProfile = function() {
                                var showed = $scope.profileModal.show();
                            };

                            if(!$scope.profileModal) {
                                $ionicModal.fromTemplateUrl('modules/chatrooms/templates/l1/profile.html', {
                                    scope: $scope,
                                    animation: 'slide-in-up'
                                }).then(function (modal) {
                                    $scope.profileModal = modal;
                                    __showProfile();
                                });
                            } else {
                                __showProfile();
                            }

                        } else if(data.customer === null) {
                            $ionicPopup.alert({
                                 title: $translate.instant("Sorry"),
                                 cssClass: "chatrooms",
                                 template: $translate.instant("We haven't found this person!")
                             });
                        } else {
                            console.error("Unknown error : ", data);
                        }
                    }
                } else {
                    console.error("Expected object, got this instead:", data);
                }
            }).error(function() {
            }).finally(function() {
                _showingCustomer = false;
            });
        }).catch(function() { _showingCustomer = false; });
    };

    $scope.closeProfileModal = function() {
        if(angular.isObject($scope.profileModal) && angular.isFunction($scope.profileModal.hide))
            $scope.profileModal.hide();
    };

    $scope.__customers_avatars_urls = {};

    $scope.customer_avatar = function(customer) {
        customer = (+customer > 0 ? customer : customer.id);
        return ($scope.__customers_avatars_urls[customer] = ($scope.__customers_avatars_urls[customer] || Customer.getAvatarUrl(customer)));
    };
}).controller('ChatroomsManageFriendsViewController', function($controller, $ionicModal, $ionicPopup, $q, $rootScope, $scope, $stateParams, $timeout, $translate, Chatrooms, Customer, Dialog, AUTH_EVENTS) {

    $scope.$on("$ionicView.beforeEnter", function() {
        $scope.loadContent();
    });

    angular.extend(this, $controller('ChatroomBaseController', {
        $ionicModal: $ionicModal,
        $ionicPopup: $ionicPopup,
        Dialog: Dialog,
        $q: $q,
        $rootScope: $rootScope,
        $scope: $scope,
        $stateParams: $stateParams,
        $timeout: $timeout,
        $translate: $translate,
        Chatrooms: Chatrooms,
        Customer: Customer,
        AUTH_EVENTS: AUTH_EVENTS
    }));

    var mapWithIds = function(destination, item) {
        if(angular.isObject(item) && angular.isNumber(+item.id)) {
            destination[item.id] = item;
        }
    };

    $scope.loadContent = function() {
        $scope.is_loading = true;
        Chatrooms.goOnline();
        $scope._updateUserStatus();
        if(!$scope.is_logged_in) {
            $scope.closeFriendsModal();
            return $scope.chooseNicknameIfNeeded();
        }
        Chatrooms.getFriends().success(function(data) {
            if(angular.isObject(data)) {
                $scope.friends = {};
                angular.forEach(data.friends, mapWithIds.bind(this, $scope.friends));
                $scope.has_friends = data.friends.length > 0;
                Chatrooms.setBuddiesToWatchList(data.friends);

                $scope.requests = {};
                angular.forEach(data.requests, mapWithIds.bind(this, $scope.requests));
                $scope.has_requests = data.requests.length > 0;

                $scope.pending_requests = {};
                angular.forEach(data.pending_requests, mapWithIds.bind(this, $scope.pending_requests));
                $scope.has_pending_requests = data.pending_requests.length > 0;

                $scope.blocked = {};
                angular.forEach(data.blocked, mapWithIds.bind(this, $scope.blocked));
                $scope.has_blocked = data.blocked.length > 0;
            } else {
                console.error("Expected an object, got this instead:", data);
            }
        }).catch(function() {
            console.error("Unexpected error :", arguments);
        }).finally(function() {
            $scope.is_loading = false;
        });
    };

    $scope.addFriend = function() {
        $ionicPopup.prompt({
          title: $translate.instant('Add friend'),
          template: $translate.instant("Enter your friend's nickname or email address"),
          cssClass: "chatrooms",
          inputType: 'text',
          inputPlaceholder: '',
          cancelText: $translate.instant("Cancel"),
          okText: $translate.instant("OK")
        }).then(function(res) {
            if(angular.isString(res) && res.trim().length > 0) {
                $scope.showCustomer(res);
            }
        });
    };

    $scope.loadContent();
    $scope.$on(Chatrooms.UPDATED_FRIENDLIST_EVENT, $scope.loadContent);

}).controller('ChatroomsListViewController', function(_, $controller, $ionicModal, $ionicPopover, $ionicPopup, $q, $rootScope, $scope, $state, $stateParams, $timeout, $translate, Chatrooms, Customer, Dialog, AUTH_EVENTS) {

    $scope.$on("$ionicView.beforeEnter", function() {
        $scope.loadContent();
    });

    angular.extend(this, $controller('ChatroomBaseController', {
        $ionicModal: $ionicModal,
        $ionicPopup: $ionicPopup,
        Dialog: Dialog,
        $q: $q,
        $rootScope: $rootScope,
        $scope: $scope,
        $stateParams: $stateParams,
        $timeout: $timeout,
        $translate: $translate,
        Chatrooms: Chatrooms,
        Customer: Customer,
        AUTH_EVENTS: AUTH_EVENTS
    }));

    var mapWithIds = function(destination, item) {
        if(angular.isObject(item) && angular.isNumber(+item.id)) {
            destination[item.id] = item;
        }
    };

    $scope.show_dividers = function() {
        var result = $scope.has_chatrooms &&
            $scope.has_friends;

        return result;
    };

    $scope.has_chatrooms = $scope.has_friends = 0;

    $scope.loadContent = function() {
        $scope.is_loading = true;
        Chatrooms.goOnline();
        $q.all(
            Chatrooms.getChatrooms().success(function(data) {
                if(angular.isObject(data)) {
                    $scope.chatrooms = {};
                    angular.forEach(Chatrooms.private_chatrooms.concat(data.chatrooms), mapWithIds.bind(this, $scope.chatrooms));
                    $scope.has_chatrooms = data.chatrooms.length > 0;
                } else {
                    console.error("Expected an object, got this instead:", data);
                }
            }),
            Chatrooms.getFriends().success(function(data) {
                if($scope._updateUserStatus() && $scope.is_logged_in) {
                    if(angular.isObject(data)) {
                        $scope.friends = {};
                        angular.forEach(data.friends, mapWithIds.bind(this, $scope.friends));
                        $scope.has_friends = data.friends.length > 0;
                        Chatrooms.setBuddiesToWatchList(data.friends);
                        Chatrooms.handleAwayForRooms(_.map(data.friends, "room"));
                    } else {
                        console.error("Expected an object, got this instead:", data);
                    }
                }
            }),
            Chatrooms.getInfos().success(function(data) {
                if(angular.isObject(data)) {
                    Chatrooms.SocketIO_Port = data.socket_io_port;
                    $scope.nickname = Chatrooms.nickname = data.nickname;
                    $scope._updateUserStatus();

                    $scope.page_title = data.page_title;
                } else {
                    console.error("Expected an object, got this instead:", data);
                }
            }),
            $ionicPopover.fromTemplateUrl('chatrooms_popover_menu.html', {
              scope: $scope
            }).then(function(popover) {
              $scope.menu_popover = popover;
            })
        ).catch(function() {
            console.error("Unexpected error :", arguments);
        }).finally(function() {
            $scope.is_loading = false;
        });
    };

    $scope.loadContent();

    $scope.$on(Chatrooms.UPDATED_FRIENDLIST_EVENT, $scope.loadContent);

    Chatrooms.onBuddiesStatusChange(function (customer_status) {
        $scope.friends[customer_status.id] = customer_status;
    });

    $scope.unreadCount = function(chatroom) {
        return Chatrooms.unreadCountForRoom(chatroom.room);
    };

    $scope.openPopover = function($event) {
        if(angular.isObject($scope.menu_popover) &&
        angular.isFunction($scope.menu_popover.show))
        $scope.menu_popover.show($event);
    };
    $scope.closePopover = function() {
        if(angular.isObject($scope.menu_popover) &&
         angular.isFunction($scope.menu_popover.hide))
            $scope.menu_popover.hide();
    };

    $scope.$on("modal.shown", function() {
        $scope._blur_chat_input();
        $scope.closePopover();
        var o = angular.isObject, f = angular.isFunction;
        if(o(cordova) && o(cordova.plugins) && o(cordova.plugins.Keyboard) && f(cordova.plugins.Keyboard.close))
            cordova.plugins.Keyboard.close();
    });

    $scope.joinPrivateRoom = function() {
        $scope.loginIfNeeded().then(function() {
            $scope.closePopover();
            $ionicPopup.prompt({
              title: $translate.instant('Join private chatroom'),
              template: $translate.instant("Enter the exact name of the private chatroom:"),
              cssClass: "chatrooms",
              inputType: 'text',
              inputPlaceholder: '',
              cancelText: $translate.instant("Cancel"),
              okText: $translate.instant("OK")
            }).then(function(res) {
                if(angular.isString(res) && res.trim().length > 0) {
                  $state.go("chatrooms-room", {value_id: $scope.value_id, type: "chatroom", receiver_id: Base64.encode(encodeURIComponent(res))});
                }
            });
        });
    };

    $scope.goToRoom = function(params) {
        if(angular.isObject(params)) {
            $state.go("chatrooms-room", angular.extend({}, params, { receiver_id: Base64.encode(encodeURIComponent(params.receiver_id)) }));
        }
    };

    $scope.$on('modal.shown', $scope.closePopover);

    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function() {
        if(angular.isObject($scope.menu_popover) && angular.isFunction($scope.menu_popover.remove))
            $scope.menu_popover.remove();
    });

}).controller('ChatroomsRoomViewController', function($controller, $cordovaCamera, $ionicActionSheet, $ionicHistory, $ionicModal, $ionicPopup, $ionicScrollDelegate, $q, $rootScope, $scope, $state, $stateParams, $timeout, $translate, Application, Chatrooms, ContextualMenu, Customer, Dialog, Url, AUTH_EVENTS) {

    angular.extend(this, $controller('ChatroomBaseController', {
        $ionicModal: $ionicModal,
        $ionicPopup: $ionicPopup,
        Dialog: Dialog,
        $q: $q,
        $rootScope: $rootScope,
        $scope: $scope,
        $stateParams: $stateParams,
        $timeout: $timeout,
        $translate: $translate,
        Chatrooms: Chatrooms,
        Customer: Customer,
        AUTH_EVENTS: AUTH_EVENTS
    }));

    $scope.private_chat = ($stateParams.type === "private");
    $scope.receiver_id = decodeURIComponent(Base64.decode($stateParams.receiver_id));

    $scope._scrollBottom = function() {
        $timeout(function() {
            $ionicScrollDelegate.scrollBottom(true);
        }, 100);
    };

    $scope.loadContent = function() {
        Chatrooms.goOnline();
        if(angular.isString($scope.receiver_id) && $scope.receiver_id.trim().length < 1 ||
            angular.isNumber(+$scope.receiver_id) && $scope.receiver_id < 1)
            return $scope.leaveRoom();

        Chatrooms.find($scope.receiver_id, $scope.private_chat).success(function(data) {
            if(angular.isObject(data)) {
                $scope.chatroom = data.chatroom || null;
                $scope.recipient = data.recipient || null;
                $scope.room = data.room;
                $scope.nickname = Chatrooms.nickname = data.nickname;
                $scope.notifications = data.notifications;
                $scope.messages = data.messages;

                $scope._updateUserStatus();

                $scope.page_title = ($scope.chatroom && $scope.chatroom.name) || ($scope.recipient && $scope.recipient.nickname);

                Chatrooms.goOnline();

                var received_msg = function (msg) {
                    var ids = [];
                    angular.forEach($scope.messages, function(m) {
                        ids.push(m.id);
                    });
                    if(ids.indexOf(msg.id) < 0)
                        $scope.messages.push(msg);
                    $scope._scrollBottom();
                };

                if($scope.private_chat) {
                   var unregister_callback = Chatrooms.watchCustomer($scope.receiver_id, function(updated) {
                       $scope.recipient = updated;
                       $scope.page_title = $scope.recipient.nickname;
                   });
                   $scope.$on("destroy", unregister_callback);
               } else {
                   if(data.private_chatroom === true) {
                       // we keep original receiver_id to recreate chatroom if needed
                       Chatrooms.savePrivateChatroom($scope.room, angular.extend({}, $scope.chatroom, {id: $scope.receiver_id}));
                   }
                   // We set receiver_id from server data (in case of a group chat, we do not have real id before that)
                   $scope.receiver_id = $stateParams.receiver_id = data.chatroom.id;
               }
                Chatrooms.onMessageFrom($scope.room, received_msg);

                $scope.showSideMenu = false;
                Chatrooms.onRoomUserListUpdate($scope.room, function(payload) {
                    $scope.showSideMenu = angular.isObject(payload) && angular.isArray(payload.users) && payload.users.length > 0;
                });
                var removeSideMenu = ContextualMenu.set("modules/chatrooms/templates/l1/contextual-menu.html", null, function() {
                    return $scope.showSideMenu;
                });
                $scope.$on("$ionicView.leave", function() {
                    Chatrooms.markRoomAsRead($scope.room);
                    removeSideMenu();
                });
                Chatrooms.joinRoom($scope.room);

                $scope._updateUserStatus();
            } else {
                console.error("Expected an object, got this instead:", data);
            }
        }).error(function() {
        }).finally(function() {
            $scope.is_loading = false;
            Chatrooms.markRoomAsRead($scope.room);

            if(!$scope.no_nickname()) {
                $scope._focus_chat_input();
            }

            $scope._scrollBottom();
        });
    };

    var updateNotificationsDebounced = _.debounce(Chatrooms.updateNotificationsSettings, 750);

    $scope.toggleNotifications = function() {
        $scope.chooseNicknameIfNeeded().then(function() {
            if($scope.notifications.all) {
                $scope.notifications.none = true;
                $scope.notifications.all = $scope.notifications.mentions = false;
            } else if ($scope.notifications.none) {
                $scope.notifications.none = $scope.notifications.all = false;
                $scope.notifications.mentions = true;
            } else if ($scope.notifications.mentions && !$scope.notifications.all) {
                $scope.notifications.none = false;
                $scope.notifications.all = $scope.notifications.mentions = true;
            }

            updateNotificationsDebounced($scope.notifications, $scope.receiver_id, $scope.private_chat);
        });
    };

    $scope.isFromMe = function(message) {
        return (message && message.senderID == Customer.id);
    };

    $scope.sendMsg = function() {
        Chatrooms.goOnline();
        if(!$scope.is_sending && !!$scope.chat_message && $scope.isConnectedToChat) {
            $scope.is_sending = true;
            Chatrooms.sendMessage($scope.receiver_id, $scope.chat_message, $scope.private_chat).then(function() {
                $timeout(function() {
                    $scope.chat_message = "";
                });
            }, function() {
            }).finally(function() {
                $scope.is_sending = false;
                $scope._focus_chat_input();
            });
        }
    };

    $scope.thumbnail_image = function(original_url) {
        return angular.isString(original_url) ? Url.get(original_url.replace(/(.*)\/(.*).jpg$/, "$1/thumb_$2.jpg"), {remove_key: true}) : original_url;
    };

    $scope.fullsize_image = function(original_url) {
        return angular.isString(original_url) ? Url.get(original_url, {remove_key: true}) : original_url;
    };

    $scope.openImage = function($event, thumb_url, image_url) {
        $scope.modalImageSrc = Url.get(image_url, {remove_key: true});

        window.open($scope.modalImageSrc, "_self");

        $q(function(resolve) {
            if(!$scope.imageModal) {
                $scope.closeImageModal = function() {
                    $scope.imageModal.hide();
                };
                $ionicModal.fromTemplateUrl('message_image_modal.html', {
                    scope: $scope,
                    animation: 'slide-in-left'
                }).then(function(modal) {
                    $scope.imageModal = modal;
                    resolve();
                });
            } else {
                resolve();
            }
        }).then(function() {
            $scope.imageModal.show();
        });

        $event.stopPropagation();
    };

    $scope.sendPhoto = function() {
        if(!$scope.is_sending) {
            $scope.imageToSend = null;

            var gotImage = function(image_url) {
                $scope.imageToSend = image_url;
                $ionicPopup.show({
                    template: '<center><img ng-src="{{imageToSend}}" style="max-width: 100%; max-height: 100%;"></center>',
                    cssClass: 'chatrooms no-title',
                    scope: $scope,
                    buttons: [{
                      text: $translate.instant('Cancel'),
                      type: 'button-default',
                      onTap: function(e) {
                          return false;
                      }
                    }, {
                      text: $translate.instant('OK'),
                      type: 'button-positive',
                      onTap: function(e) {
                        return true;
                      }
                    }]
                }).then(function(result) {
                    if(result) {
                        $scope.is_sending = true;
                        Chatrooms.sendPicture($scope.receiver_id, $scope.imageToSend, $scope.private_chat).then(function() {
                        }, function() {
                        }).finally(function() {
                            $scope.imageToSend = null;
                            $scope.is_sending = false;
                            $scope._focus_chat_input();
                        });
                    } else {
                        $scope.imageToSend = null;
                    }
                });
            };

            var gotError = function(err) {
                // An error occured. Show a message to the user
            };

            if(Application.is_webview) {
                var input = angular.element("<input type='file' accept='image/*'>");
                var selectedFile = function(evt) {
                    var file=evt.currentTarget.files[0];
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        gotImage(evt.target.result);
                        input.off("change", selectedFile);
                    };
                    reader.onerror = gotError;
                    reader.readAsDataURL(file);
                };
                input.on("change", selectedFile);
                input[0].click();
            } else {
                var source_type = Camera.PictureSourceType.CAMERA;

                // Show the action sheet
                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                        { text: $translate.instant("Take a picture") },
                        { text: $translate.instant("Import from Library") }
                    ],
                    cancelText: $translate.instant("Cancel"),
                    cancel: function() {
                        hideSheet();
                    },
                    buttonClicked: function(index) {
                        if(index == 0) {
                            source_type = Camera.PictureSourceType.CAMERA;
                        }
                        if(index == 1) {
                            source_type = Camera.PictureSourceType.PHOTOLIBRARY;
                        }

                        var options = {
                            quality : 90,
                            destinationType : Camera.DestinationType.DATA_URL,
                            sourceType : source_type,
                            encodingType: Camera.EncodingType.JPEG,
                            targetWidth: 1200,
                            targetHeight: 1200,
                            correctOrientation: true,
                            popoverOptions: CameraPopoverOptions,
                            saveToPhotoAlbum: false
                        };

                        $cordovaCamera.getPicture(options).then(function(imageData) {
                            gotImage("data:image/jpeg;base64," + imageData);
                        }, gotError);

                        return true;
                    }
                });
            }
        }
    };

    $scope.leaveRoom = function() {
        Chatrooms.leaveRoom($scope.room, _.get($scope, "chatroom.id"), _.get($scope, "recipient.id"));
        $scope.closeModal(false);
        if($ionicHistory.backView()) {
            $ionicHistory.goBack();
        }
        else {
            $ionicHistory.clearHistory();
            $ionicHistory.nextViewOptions({
                disableBack: true,
                historyRoot: true
            });
            $state.go("chatrooms-list", {value_id: $scope.value_id}, {location:'replace'}).then(function() {
                $ionicHistory.backView(null);
                $ionicHistory.clearHistory();
            });
        }
    };

    $scope.$on("$ionicView.enter", function() {
        if($scope.is_loading === false) {
            $scope._focus_chat_input();
        }
        if(angular.isString($scope.room)) {
            Chatrooms.markRoomAsRead($scope.room);
        }
    });

    $scope.loadContent();
}).controller("ChatroomsContextualMenuController", function($controller, $ionicModal, $ionicPopup, $q, $rootScope, $scope, $stateParams, $timeout, $translate, Chatrooms, Customer, AUTH_EVENTS) {

    angular.extend(this, $controller('ChatroomBaseController', {
        $ionicModal: $ionicModal,
        $ionicPopup: $ionicPopup,
        $q: $q,
        $rootScope: $rootScope,
        $scope: $scope,
        $stateParams: $stateParams,
        $timeout: $timeout,
        $translate: $translate,
        Chatrooms: Chatrooms,
        Customer: Customer,
        AUTH_EVENTS: AUTH_EVENTS
    }));

    $scope.private_chat = $stateParams.type === "private";
    $scope.receiver_id = $stateParams.receiver_id;

    $scope.is_loading = true;

    $scope.loadContent = function() {
        Chatrooms.goOnline();
        if(!$scope.room || $scope.is_loading) {
            Chatrooms.find($scope.receiver_id, $scope.private_chat).success(function(data) {
                if(angular.isObject(data)) {
                    $scope.room = data.room;
                    Chatrooms.onRoomUserListUpdate($scope.room, function(payload) {
                        $scope.chat_people = [];
                        if(angular.isArray(payload.users)) {
                            $scope.chat_people = payload.users;
                        }
                        $scope.has_chat_people = $scope.chat_people.length > 0;
                    });
                } else {
                    console.error("Expected an object, got this instead:", data);
                }
            }).error(function() {
            }).finally(function() {
                $scope.is_loading = false;
            });
        }
    };

    $scope.loadContent();
});
