App.controller('TaxiRideEstimateRideModalController', function(_, $ionicPopup, $ionicScrollDelegate, $scope, $translate, $timeout, SafePopups, TaxiRide) {

    $scope.currency_symbol = TaxiRide.currency_symbol;

    $scope.info = {
        "step_1": true,
        "step_2": false,
        "type_choice": null,
        "payment_choice": null
    };

    TaxiRide.getVehiculeTypes().then(function(data) {

        $scope.vehicule_list = _.map(data, function(vt) {
            return _.extend(
                {},
                vt,
                {
                    picture: ((_.isString(_.get(vt, "picture")) && vt.picture.length > 0) ? (DOMAIN + "/" + vt.picture) : null)
                }
            );
        });
    });

    $scope.validateVehiculeType = function() {
        if($scope.info.type_choice) {
            $scope.info.step_1 = false;
            $scope.info.step_2 = true;

            TaxiRide.getDriversAroundLocation($scope.ride.pickup_lat, $scope.ride.pickup_long, $scope.info.type_choice).success(function(data) {
                $scope.available_drivers = data.drivers;
                $scope.no_driver_available = !$scope.available_drivers.length;
                $scope.available_methods = data.payment_method;
                $scope.tco_available = TaxiRide.tco_available;
                $scope.stripe_available = TaxiRide.stripe_available;

                $scope.min_estimate = 9999;
                $scope.max_estimate = 0;

                _.forEach($scope.available_drivers, function(driver) {
                    if(driver.distance_fare) {
                        driver_fare = parseFloat(driver.base_fare) + driver.distance_fare * ($scope.ride.route.legs[0].distance.value/1000);
                    } else {
                        driver_fare = parseFloat(driver.base_fare) + driver.time_fare * ($scope.ride.route.legs[0].duration.value/60);
                    }

                    if(driver_fare < $scope.min_estimate) {
                        $scope.min_estimate = parseFloat(driver_fare).toFixed(2);
                    }

                    if(driver_fare > $scope.max_estimate) {
                        $scope.max_estimate = parseFloat(driver_fare).toFixed(2);
                    }

                });
            });
        } else {
            SafePopups.show('show', {
                subTitle: $translate.instant("Please choose a vehicle type"),
                buttons: [{
                    text: $translate.instant("OK")
                }]
            });
        }
    };

    $scope.validateRequest = function() {
        if($scope.info.payment_choice) {
            var request = {
                "pickup_address": $scope.ride.pickup_address,
                "pickup_lat": $scope.ride.pickup_lat,
                "pickup_long": $scope.ride.pickup_long,
                "dropoff_address": $scope.ride.dropoff_address,
                "dropoff_lat": $scope.ride.dropoff_lat,
                "dropoff_long": $scope.ride.dropoff_long,
                "payment_method": $scope.info.payment_choice
            };

            TaxiRide.passenger.makeRequest(request, $scope.info.type_choice).then(function(data) {
                if(data.success) {
                    TaxiRide.showDriverWaitingModal(data.request);
                    $scope.close();
                } else {
                    SafePopups.show('show', {
                        subTitle: $translate.instant("An error occured while lauching your request. Please try again later."),
                        buttons: [{
                            text: $translate.instant("OK")
                        }]
                    });
                }
            });

        } else {
            SafePopups.show('show', {
                subTitle: $translate.instant("Please choose a payment method"),
                buttons: [{
                    text: $translate.instant("OK")
                }]
            });
        }
    };

    $scope.close = function() {
        $scope.$close();
    };

});
