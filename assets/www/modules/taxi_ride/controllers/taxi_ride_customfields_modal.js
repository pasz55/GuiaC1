App.controller('TaxiRideCustomFieldsModalController', function(_, $ionicPopup, $scope, $timeout, $translate, TaxiRide) {
    $scope.states_list = TaxiRide.states_list;
    $scope.shown_states = {};

    $scope.custom_fields = TaxiRide.custom_fields;
    $scope.custom_fields_data = TaxiRide.custom_fields_data;
    $scope.countries_list = TaxiRide.countries_list;

    if(TaxiRide.role === "driver") {
        $scope.is_loading = true;

        TaxiRide.getVehiculeTypes().then(function(vehicule_types) {
            $scope.vehicule_types = _.map(vehicule_types, function(vt) {
                return _.extend(
                    {},
                    vt,
                    {
                        picture: ((_.isString(_.get(vt, "picture")) && vt.picture.length > 0) ? (DOMAIN+"/"+vt.picture) : null)
                    }
                );
            });
        }, function() {
            console.error("[TaxiRide] Error while fetching vehicle types");
        }).finally(function() {
            $scope.is_loading = false;
        });
    }

    $scope.switchCountry = function() {
        if($scope.states_list[$scope.custom_fields_data['country']]) {
            $scope.shown_states = $scope.states_list[$scope.custom_fields_data['country']];
        } else {
            $scope.shown_states = {"none": $translate.instant("None")};
            $scope.custom_fields_data['state'] = "none";
        }
    };

    $scope.close = function() {
        $scope.$emit(TaxiRide.CUSTOM_FIELDS_MODAL_STATE_UPDATE, false);
        $scope.$close();
    };

    $scope.save = function() {
        $scope.is_loading = true;
        TaxiRide.saveCustomerCustomFields($scope.custom_fields_data).then(function() {
            $scope.$emit(TaxiRide.CUSTOM_FIELDS_MODAL_STATE_UPDATE, true);
            $scope.$close();
        }, function(resp) {
            if(_.isObject(resp) && _.isArray(resp.errors) && resp.errors.length > 0) {
                $ionicPopup.alert({
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
    }

    $scope.switchCountry();
});
