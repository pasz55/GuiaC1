App.controller('TaxiRideHistoryModalController', function(_, $ionicPopup, $ionicLoading, $scope, $state, $translate, TaxiRide, SafePopups) {

    $scope.requests = {};

    $scope.load = function() {
        $scope.loading = true;

        $ionicLoading.show({
            template: $translate.instant("Loading") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });

        TaxiRide.getRequestHistory(TaxiRide.role).success(function(data) {
            $ionicLoading.hide();
            $scope.loading = false;
            $scope.requests = data;
        });
    };

    $scope.load();

    $scope.close = function() {
        $scope.$close();
    };

    $scope.showDetails = function(request) {
        //Showing details
        var template = '<div class="list">';
        template += '<div class="item item-divider">' +
                    $translate.instant("Date") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                    request.date +
                '</div>' +
                '<div class="item item-divider">' +
                    $translate.instant("Price") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                    request.price +
                '</div>';

                if(TaxiRide.role == "passenger") {
                    template += '<div class="item item-divider">' +
                        $translate.instant("Driver Name") +
                        '</div>' +
                        '<div class="item item-text-wrap">' +
                        request.driver_name +
                        '</div>';
                } else {
                    template += '<div class="item item-divider">' +
                    $translate.instant("Passenger Name") +
                    '</div>' +
                    '<div class="item item-text-wrap">' +
                    request.passenger_name +
                    '</div>';
                }

                template +=
                '<div class="item item-divider">' +
                    $translate.instant("Status") +
                '</div>' +
                '<div class="item item-text-wrap ucfirst">' +
                    $translate.instant(request.status) +
                '</div>' +
                '<div class="item item-divider">' +
                    $translate.instant("Payment method") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                    $translate.instant(request.payment_method) +
                '</div>' +
                '<div class="item item-divider">' +
                    $translate.instant("Payment status") +
                '</div>' +
                '<div class="item item-text-wrap ucfirst">' +
                    $translate.instant(request.payment_status) +
                '</div>' +
            '</div>';

        //Button to permit customer to pay ride
        var popupButtons = [];
        if(TaxiRide.stripe_available && (TaxiRide.payment_methods == 'all' || TaxiRide.payment_methods == 'stripe') && TaxiRide.role == "passenger" && request.payment_status === "unpaid" && request.status === "finished") {
            popupButtons.push({
                text: $translate.instant('Pay by card'),
                type: 'button-assertive',
                onTap: function(e) {
                    if(_.isObject(TaxiRide.payments_settings_data.card) && _.isString(TaxiRide.payments_settings_data.card.last4)) {
                        SafePopups.show("confirm",{
                            title: $translate.instant('Confirmation'),
                            template: $translate.instant("Do you confirm you want to pay by card?")
                        }).then(function(res){
                            if(res) {
                                TaxiRide.pay(request.id).then(function(request){
                                    $scope.load();
                                });
                            } else {
                                $scope.showDetails(request);
                            }
                        });
                    } else {
                        SafePopups.show("confirm",{
                            title: $translate.instant('No card set'),
                            template: $translate.instant("You do not have any card configurated. Go to settings?")
                        }).then(function(res){
                            if(res) {
                                TaxiRide.showPaymentsSettingsModal();
                            } else {
                                $scope.showDetails(request);
                            }
                        });
                    }
                }
            });
        }

        //Button to allow customer to pay with 2CO
        if(TaxiRide.tco_available && (TaxiRide.payment_methods == 'all' || TaxiRide.payment_methods == '2co') && TaxiRide.role == "passenger" && request.payment_status === "unpaid" && request.status === "finished") {
            popupButtons.push({
                text: $translate.instant('Pay by card'),
                type: 'button-assertive',
                onTap: function(e) {
                    $scope.$close();
                    $state.go("taxi_ride-tco", {"value_id": TaxiRide.value_id, "request_id": request.id});
                }
            });
        }

        //Button to permit driver to set ride as paid
        if(TaxiRide.role == "driver" && request.payment_status === "unpaid" && request.status === "finished") {
            popupButtons.push({
                text: $translate.instant('Mark as paid'),
                type: 'button-assertive',
                onTap: function(e) {
                    SafePopups.show("confirm",{
                        title: $translate.instant('Confirmation'),
                        template: $translate.instant("Do you confirm that ride is paid?")
                    }).then(function(res){
                        if(res) {
                            TaxiRide.setRideAsPaid(request.id).finally($scope.load);
                        } else {
                            $scope.showDetails(request);
                        }
                    });
                }
            });
            popupButtons.push({
                text: $translate.instant('Change price'),
                type: 'button-assertive',
                onTap: function(e) {
                    TaxiRide.driver.setRidePrice(request.id).then(
                        $scope.load,
                        function() {
                            $scope.showDetails(request);
                        }
                    );
                }
            });
        }

        popupButtons.push({
            text: $translate.instant('Ok'),
            type: 'button-positive'
        });

        var dialog_data = {
            title: $translate.instant("Request") + ' ' + request.id,
            cssClass: "taxiride",
            scope: $scope,
            template: template,
            buttons: popupButtons
        };

        SafePopups.show("show",dialog_data);
    }

});
