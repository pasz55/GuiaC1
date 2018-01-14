App.config(function($stateProvider) {

    $stateProvider
        .state('scratchcard-view', {
            url             : BASE_PATH+"/scratchcard/mobile_view/index/value_id/:value_id",
            controller      : 'ScratchcardViewController',
            templateUrl     : "modules/scratchcard/templates/l1/view.html",
            cache           : false
        });

}).controller('ScratchcardViewController', function($rootScope, $scope, $state, $stateParams, $timeout, $translate,
                                                    Customer, Dialog, Url, Scratchcard, SB) {

    $scope.$on(SB.EVENTS.AUTH.loginSuccess, function() {
        $scope.is_logged_in = true;
        $scope.loadContent();
    });

    $scope.$on(SB.EVENTS.AUTH.logoutSuccess, function() {
        $scope.is_logged_in = false;
        $scope.loadContent();
    });

    $scope.value_id = Scratchcard.value_id = $stateParams.value_id;
    $scope.card = {};
    $scope.collection = {};
    $scope.is_logged_in = false;
    $scope.rewards = {};

    $scope.is_loading = true;

    $scope.pad = {
        password: "",
        add: function(nbr) {

            if(this.password.length < 4) {

                this.password += nbr;
                if(this.password.length == 4) {
                    $scope.validate();
                }

            }
            return this;
        },
        remove: function() {
            this.password = this.password.substr(0, this.password.length - 1);
            return this;
        }
    };

    $scope.loadContent = function() {
        $scope.is_logged_in = Customer.isLoggedIn();
        $scope.is_loading = true;
        var customer_id = Customer.id ? Customer.id : null;
        Scratchcard.findAll(customer_id)
            .success(function(data) {
                $scope.collection = data.collection;
                $scope.card = data.collection.card;
                $scope.tc_id = data.tc_id;

                if($scope.card) {
                    $scope.card.is_locked = false;
                    $scope.card.is_locked_for_attempt = false;
                    $scope.card.is_locked_for_winner = false;

                    //We got a valid card, but we need to check if the customer can use it
                    if(!$scope.card.only_once && (parseInt($scope.collection.attempts_for_customer) > 0)) {
                        //The card is not reusable, and the user already used it
                        $scope.card.is_locked = true;
                    }

                    if($scope.card.only_once && (parseInt($scope.card.nb_attempt) > 0) && (parseInt($scope.collection.attempts_for_customer) >= parseInt($scope.card.nb_attempt))) {
                        //The card is reusable, but got a daily attempt limit
                        //And the user have reach the limit
                        $scope.card.is_locked = true;
                        $scope.card.is_locked_for_attempt = true;
                    }

                    //We got a valid card, but the maximum nb of winner has been reached
                    if(parseInt($scope.card.winner_max) <= parseInt($scope.collection.nb_winners)) {
                        //The card is not reusable, and the user already used it
                        $scope.card.is_locked = true;
                        $scope.card.is_locked_for_winner = true;
                    }

                }

                if($scope.card) {
                    $scope.image = Url.get("/scratchcard/mobile_view/getimage", {"image": $scope.card.image_foreground, "value_id": $scope.value_id});
                }
                $scope.page_title = data.page_title;
            }).finally(function() {
                $scope.is_loading = false;
            });
    };

    $scope.openPad = function(reward) {

        if($rootScope.isOverview) {
            $rootScope.showMobileFeatureOnlyError();
            return;
        }

        if(!Customer.isLoggedIn()) {
            $scope.login();
            return;
        }

        $scope.pad.modal = {};
        $scope.pad.password = "";
        $scope.pad.buttons = [];
        for(var i = 0; i < 10; i++) $scope.pad.buttons.push(i);
        $scope.pad.reward = reward;

        Modal.fromTemplateUrl('templates/loyaltycard/l1/pad.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.pad.modal = modal;
            $scope.pad.modal.show();
        });

    };
    $scope.closePad = function() {
        $scope.pad.modal.hide();
    };

    $scope.validate = function() {

        Scratchcard.validate($scope.pad)
            .success(function (data) {
                if (data) {
                    if(data.message) {
                        Dialog.alert('', data.message, 'OK');
                    }

                    if(data.close_pad) {
                        $scope.closePad();
                    } else {
                        $scope.pad.password = '';
                    }
                    $timeout(function() {
                        $scope.loadContent()
                    });
                }
            }).error(function(data) {
                if (data && data.message) {
                    Dialog.alert('Error', data.message, 'OK');

                    if (data.close_pad) {
                        $scope.closePad();
                    } else {
                        $scope.pad.password = "";
                    }
                }
            });
    };

    $scope.login = function () {
        Customer.loginModal($scope);
    };

    $scope.alertLogin = function () {
        var message = '';

        if($scope.card.is_locked_for_attempt) {
            message = $translate.instant("You have already used your daily limit for this card. Come back tomorrow!");
        } else if($scope.card.is_locked_for_winner) {
            message = $translate.instant("Sorry, but the maximum number of winners for this card has been reached. Come back for the next game!");
        } else {
            message = $translate.instant("Log in to scratch your card!");
        }

        Dialog.alert('Sorry!', message, 'OK');
    };

    $scope.log = function (is_win, points_earned) {

        if(Customer.id) {
            //We log the attempt
            is_win = is_win ? "1" : "0";
            Scratchcard.logAttempt($scope.card.card_id, Customer.id, $scope.card.reward.reward_id, is_win, points_earned)
                .success(function (data) {
                    if (data.success) {

                    } else {
                        if (is_win) {
                            Dialog.alert('Error', 'Error while creating your reward. Sorry for the inconvenience.', 'OK');
                        }
                    }
                }).error(function (data) {

                    if (data && data.message) {
                        Dialog.alert('Error', data.message, 'OK');
                    }
                });
        }
    };

    $scope.endScratch = function() {
        $timeout(function() {
            $scope.card = {};
            $scope.loadContent()
        }, 1);
    };


    $scope.showTc = function() {
        $state.go("tc-view", {tc_id: $scope.tc_id});
    };

    $scope.$on('$destroy', function() {
        if($scope.pad.modal) {
            $scope.pad.modal.remove();
        }
    });

    $scope.loadContent();

});