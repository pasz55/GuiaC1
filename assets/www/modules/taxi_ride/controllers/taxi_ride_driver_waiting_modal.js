App.controller('TaxiRideDriverWaitingModalController', function(_, $interval, $ionicLoading, $ionicPopup, $scope, $timeout, $translate, SafePopups, TaxiRide) {

    $scope.init = function() {
        $scope.currency_symbol = TaxiRide.currency_symbol;
        $scope.prices_disclamer = TaxiRide.prices_disclamer;
        $scope.original_scope.has_launched_request = false;
        $scope.is_looking_for_drivers = true;
        $scope.no_driver_answer = false;
        $scope.drivers = [];
        $scope.timer = TaxiRide.search_timeout;
        $scope.can_select_driver = true;
    };

    $scope.init();

    $scope.$on("modal.hidden")

    var search_interval = $interval(function() {$scope.updateTimer()}, 1000);
    var select_interval = null;

    $scope.updateTimer = function() {
        if($scope.timer > 0) {
            $scope.timer--;
        } else {
            $interval.cancel(search_interval);
            $scope.is_looking_for_drivers = false;
            if(!$scope.drivers.length) {
                $scope.no_driver_answer = true;
            } else {
                $scope.select_timer = TaxiRide.search_timeout;
                select_interval = $interval(function() {$scope.updateSelectTimer()}, 1000);
            }
        }
    };

    $scope.updateSelectTimer = function() {
        if($scope.select_timer > 0) {
            $scope.select_timer--;
        } else {
            $interval.cancel(select_interval);
            $scope.can_select_driver = false;
            TaxiRide.updateStatus($scope.request, "cancelled");
        }
    };

    $scope.$on(TaxiRide.DRIVER_ACCEPTED_REQUEST, function(event, driver, request) {
        driver.request = request;
        $scope.drivers.push(driver);
    });

    $scope.selectDriver = function(driver) {
        $ionicLoading.show({
            template: $translate.instant("Sending request") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });
        $timeout(function() { $ionicLoading.hide(); }, 15000);
        TaxiRide.passenger.acceptRequest(driver.request, driver);
        $scope.original_scope.has_launched_request = true;
        $scope.close();
    };

    $scope.close = function() {
        if(search_interval) {
            $interval.cancel(search_interval);
        }
        if(select_interval) {
            $interval.cancel(select_interval);
        }
        $scope.$close();
    };
});
