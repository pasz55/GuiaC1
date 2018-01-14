App.controller('TaxiRidePaymentsSettingsModalController', function(_, $ionicPopup, $ionicLoading, $scope, $timeout, $translate, SafePopups, TaxiRide) {
    $scope.distance_unit = TaxiRide.distance_unit;
    $scope.payments_settings = TaxiRide.payments_settings_data;
    $scope.show_card_form = false;
    $scope.removing = false;
    $scope.payment_methods = TaxiRide.payment_methods;

    if(!_.isObject($scope.payments_settings))
        $scope.payments_settings = {};

    if($scope.role === "driver") {
        $scope.payments_settings.charge_mode = _.isNumber($scope.payments_settings.time_fare) && $scope.payments_settings.time_fare > 0 ? "time" : "distance";
    } else {
        $scope.card = {};
        $scope.payments_settings.cash = !!$scope.payments_settings.cash ? "cash" : null;
        if(_.isObject($scope.payments_settings.card)) {
            var exp_text = $translate.instant("%MONTH%/%YEAR%");
            exp_text = exp_text.replace("%MONTH%", $scope.payments_settings.card.exp_month);
            exp_text = exp_text.replace("%YEAR%", $scope.payments_settings.card.exp_year);
            $scope.payments_settings.card.exp_text = exp_text;
        }
    }

    $scope.payments_settings_charge_modes = [{
        label: $translate.instant("Distance"),
        id: "distance"
    }, {
        label: $translate.instant("Duration"),
        id: "time"
    }];

    $scope.close = function() {
        $scope.$emit(TaxiRide.PAYMENTS_SETTINGS_MODAL_STATE_UPDATE, false);
        $scope.$close();
    };

    $scope.removepaymentcard = function() {
        // A confirm dialog
        var confirmPopup = SafePopups.show("confirm",{
            title: 'Confirmation',
            template: 'Do you really want to remove this credit card?'
        });

        confirmPopup.then(function(res) {
            if(res) {
                TaxiRide.removeCustomerPaymentCard().then(function() {
                    $scope.payments_settings.card = false;
                    TaxiRide.payments_settings_data.card = false;
                    $scope.$close()
                }, function(resp) {
                    if(_.isObject(resp) && _.isArray(resp.errors) && resp.errors.length > 0) {
                        SafePopups.show("alert", {
                            title: $translate.instant("An error occured while saving!"),
                            template: "<ul>" +
                                _.map(
                                    resp.errors,
                                    function(i) {
                                        return "<li>" +
                                            i.replace(
                                                    /[\u00A0-\u9999<>\&]/gim,
                                                function(i) {
                                                    return '&#'+i.charCodeAt(0)+';';
                                                }
                                            ) +
                                            "</li>";
                                    }
                                ).join("") +
                                "</ul>",
                            okText: $translate.instant("OK")
                        });
                    } else {
                        $ionicPopup.alert({
                            title: $translate.instant("An error occured while saving!"),
                            template: $translate.instant("Please try again later."),
                            okText: $translate.instant("OK")
                        });
                    }
                });
            }
        });
    }

    $scope.save = function(force) {
        if($scope.is_loading && force !== true)
            return;

        $scope.is_loading = true;
        var data = angular.copy($scope.payments_settings);

        if($scope.role === "driver") {
            if(data.charge_mode === "distance") {
                data.time_fare = undefined;
                delete data.time_fare;
            } else {
                data.distance_fare = undefined;
                delete data.distance_fare;
            }
            data.charge_mode = undefined;
            delete data.charge_mode;
        } else if ($scope.role === "passenger") {
            if (_.isObject($scope.card_token) && $scope.card_token.token.length > 0) {
                data.card = angular.copy($scope.card_token);
            } else if(_.isObject($scope.card) &&
                      _([+$scope.card.number, +$scope.card.exp_month, +$scope.card.exp_year, +$scope.card.cvc]).reject(_.isNaN).max() > 0) {
                $timeout(function() {

                    if($scope.card.exp_year > 0 && $scope.card.exp_year < 100)
                        $scope.card.exp_year += 2000;

                    var error_messages = [];

                    if(!($scope.card.number > 0))
                        error_messages.push($translate.instant("Please enter a credit card number"));

                    if(!($scope.card.exp_month > 0))
                        error_messages.push($translate.instant("Please enter the credit card expiration month"));

                    if(!($scope.card.exp_year > 0))
                        error_messages.push($translate.instant("Please enter the credit card expiration year"));

                    if(error_messages.length > 0) {
                        SafePopups.show('show', {
                            subTitle: error_messages.shift(),
                            buttons: [{
                                text: $translate.instant("OK")
                            }]
                        });

                        $scope.is_loading = false;
                        return;
                    }

                    Stripe.setPublishableKey(TaxiRide.stripe_key);
                    $ionicLoading.show({
                        template: $translate.instant("Checking information") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
                    });
                    try {
                        Stripe.card.createToken($scope.card, function (status, response) {
                            $ionicLoading.hide();
                            if (response.error) {
                                SafePopups.show("show", {
                                    subTitle: response.error.message,
                                    buttons: [{
                                        text: $translate.instant("OK")
                                    }]
                                });
                                $scope.is_loading = false;
                            } else {
                                $scope.card_token = {
                                    token: response.id,
                                    last4: response.card.last4,
                                    brand: response.card.brand,
                                    exp_month: response.card.exp_month,
                                    exp_year: response.card.exp_year,
                                    exp: Math.round(+(new Date((new Date(response.card.exp_year, response.card.exp_month, 1)) - 1)) / 1000) | 0
                                };
                                $scope.save(true);
                            }
                        });
                    } catch (e) {
                        $ionicLoading.hide();
                        SafePopups.show("show", {
                            subTitle: e+"",
                            buttons: [{
                                text: $translate.instant("OK")
                            }]
                        });
                        $scope.is_loading = false;
                    }
                });
                return;
            }
        }

        TaxiRide.savePaymentsSettingsFields(data).then(function() {
            $scope.$close();
        }, function(resp) {
            if(_.isObject(resp) && _.isArray(resp.errors) && resp.errors.length > 0) {
                SafePopups.show("alert", {
                    title: $translate.instant("An error occured while saving!"),
                    template: "<ul>" +
                        _.map(
                            resp.errors,
                            function(i) {
                                return "<li>" +
                                    i.replace(
                                            /[\u00A0-\u9999<>\&]/gim,
                                        function(i) {
                                            return '&#'+i.charCodeAt(0)+';';
                                        }
                                    ) +
                                    "</li>";
                            }
                        ).join("") +
                        "</ul>",
                    okText: $translate.instant("OK")
                });
            } else {
                $ionicPopup.alert({
                    title: $translate.instant("An error occured while saving!"),
                    template: $translate.instant("Please try again later."),
                    okText: $translate.instant("OK")
                });
            }
        }).finally(function() {
            $scope.is_loading = false;
        });
    };

    function loadContent() {
        $scope.page_title = TaxiRide.page_title;
        if($scope.role === "passenger") {
            if(typeof Stripe == "undefined") {
                $scope.is_loading = true;
                var stripeJS = document.createElement('script');
                stripeJS.type = "text/javascript";
                stripeJS.src = "https://js.stripe.com/v2/";
                stripeJS.onload = function() {
                    $timeout(function() {
                        $scope.is_loading = false;
                    });
                };
                document.body.appendChild(stripeJS);
            } else {
                $scope.is_loading = false;
            }
        } else {
            $scope.is_loading = false;
        }
    }

    $scope.is_loading = true;
    if(!TaxiRide.loaded) {
        TaxiRide.load().then(loadContent);
    } else {
        loadContent();
    }

    $scope.$on("$destroy", console.log.bind(this));

});
