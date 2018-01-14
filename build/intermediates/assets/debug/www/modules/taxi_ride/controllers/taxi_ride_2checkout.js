App.config(function($stateProvider) {
    $stateProvider.state('taxi_ride-tco', {
        url: BASE_PATH+"/taxiride/mobile_view/tco/value_id/:value_id/request_id/:request_id",
        controller: 'TaxiRideTcoController',
        templateUrl: "modules/taxi_ride/templates/l1/creditcard-form.html"
    });
}).controller('TaxiRideTcoController', function(_, AUTH_EVENTS, $ionicHistory, $ionicLoading, $ionicViewSwitcher, $scope, $stateParams, $state, $timeout, $translate, Customer, SafePopups, TaxiRide) {

    $scope.value_id = TaxiRide.value_id = $stateParams.value_id;
    $scope.request_id = $stateParams.request_id;

    $scope.card = {};

    $scope.loadContent = function() {
        $ionicLoading.show({
            template: $translate.instant($translate.instant("Loading")+"...") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });

        $scope.page_title = $translate.instant("Pay online");

        if(typeof TCO == "undefined") {
            $scope.is_loading = true;
            var tcoJS = document.createElement('script');
            tcoJS.type = "text/javascript";
            tcoJS.src = "https://www.2checkout.com/checkout/api/2co.min.js";
            tcoJS.onload = function() {
                $timeout(function() {
                    $scope.initTCO();
                });
            };
            document.body.appendChild(tcoJS);
        } else {
            $scope.initTCO();
        }

    };

    $scope.initTCO = function() {
        TCO.loadPubKey('sandbox', function() {

            TaxiRide.tco.getConfig($scope.request_id).success(function(data) {
                 $scope.tco_config = data;
            }).error(function() {
                SafePopups.show("show", {
                    subTitle: $translate.instant("Error while retrieving 2Checkout configuration from server."),
                    buttons: [{
                        text: $translate.instant("OK")
                    }]
                });
            }).finally(function() {
                $ionicLoading.hide();
                $scope.is_loading = false;
            });

        });
    };

    $scope.tokenRequest = function() {

        $scope.is_loading = true;
        $ionicLoading.show({
            template: $translate.instant($translate.instant("Checking information")+"...") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });

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
            $ionicLoading.hide();
            return;
        }
        // Setup token request arguments
        var args = {
            sellerId: $scope.tco_config.sid,
            publishableKey: $scope.tco_config.publishable_key,
            ccNo: $scope.card.number.toString(),
            cvv: $scope.card.cvc.toString(),
            expMonth: $scope.card.exp_month.toString(),
            expYear: $scope.card.exp_year.toString()
        };

        // Make the token request
        TCO.requestToken($scope.successCallback, $scope.errorCallback, args);
    };

    $scope.successCallback = function(data) {

        $ionicLoading.hide();

        $ionicLoading.show({
            template: $translate.instant($translate.instant("Loading")+"...") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });

        TaxiRide.tco.processTransaction(data.response.token.token, $scope.tco_config.price, $scope.request_id).success(function(data) {
            $state.go("taxi_ride-view", {"value_id": $scope.value_id});
        }).error(function(data) {
            SafePopups.show("show", {
                title: $translate.instant("Error"),
                subTitle: $translate.instant(data.error_message),
                buttons: [{
                    text: $translate.instant("OK")
                }]
            });
        }).finally(function() {
            $ionicLoading.hide();
            $scope.is_loading = false;
        });
    };

    $scope.errorCallback = function(data) {
        SafePopups.show("show", {
            title: $translate.instant("Error"),
            subTitle: $translate.instant(data.errorMsg),
            buttons: [{
                text: $translate.instant("OK")
            }]
        });
        $scope.is_loading = false;
        $ionicLoading.hide();
    };

    $scope.is_loading = true;
    $scope.loadContent();

});
