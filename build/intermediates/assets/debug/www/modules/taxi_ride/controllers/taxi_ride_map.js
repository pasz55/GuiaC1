App.config(function($stateProvider) {
    $stateProvider.state('taxi_ride-view', {
        url: BASE_PATH+"/taxiride/mobile_view/index/value_id/:value_id",
        controller: 'TaxiRideMapController',
        templateUrl: "modules/taxi_ride/templates/l1/view.html",
        cache: false
    }).state('taxi_ride-map', {
        url: BASE_PATH+"/taxiride/mobile_view/index/value_id/:value_id/map",
        controller: 'TaxiRideMapController',
        templateUrl: "modules/taxi_ride/templates/l1/view.html",
        cache: false
    });
}).controller('TaxiRideMapController', function(_, AUTH_EVENTS, $cordovaGeolocation, $interval, $ionicHistory,
                                                $ionicLoading, $http, $q,  $scope, $stateParams, $state, $translate,
                                                $timeout, ContextualMenu, Customer, GoogleMaps, SafePopups,
                                                TaxiRide, Url) {

    var $value_id = null;
    var controller = {};

    var MAP_OPTIONS = {
        zoom: 3,
        center: {lat: 43.600000, lng: 1.433333},
        disableDefaultUI: true
    };

    var has_4coords = function () {
        return _([
            $scope.ride.pickup_lat,
            $scope.ride.pickup_long,
            $scope.ride.dropoff_lat,
            $scope.ride.dropoff_long
        ]).filter(function(e) {
            return _.isNumber(e) && !isNaN(e);
        }).value().length == 4;
    };

    controller.common = new (function common() {
        var customer_id = null;

        this.checkCustomer = function(passengerInfosNeeded) {
            passengerInfosNeeded = (passengerInfosNeeded === true);
            var showModals = (TaxiRide.role === "driver" || passengerInfosNeeded);

	          if(_.isNumber(+Customer.id) && +Customer.id > 0) {

		            if(customer_id != Customer.id) {
			              controller.common.resetMap();
			              customer_id = Customer.id;
		            }

                $scope.all_valid = false;

		            if(TaxiRide.areCustomFieldsValid() === false) {
				            if(showModals) {
			                  return $q.resolve(TaxiRide.showCustomFieldsModal(true).then(function() {
				                    return $q.resolve(controller.common.checkCustomer());
			                  }, function() {
				                    if(TaxiRide.role === "driver") {
					                      if($ionicHistory.backView()) {
						                        $ionicHistory.goBack(-999);
					                      } else {
						                        $state.go("home");
					                      }
                            }
			                  }));
                    }
		            } else if(TaxiRide.arePaymentsSettingsValid() === false) {
                    if(showModals) {
			                  return $q.resolve(TaxiRide.showPaymentsSettingsModal(true).then(function() {
				                    return $q.resolve(controller.common.checkCustomer());
			                  }, function() {
				                    if(TaxiRide.role === "driver") {
					                      if($ionicHistory.backView()) {
						                        $ionicHistory.goBack(-999);
					                      } else {
						                        $state.go("home");
					                      }
				                    }
			                  }));
                    }
		            } else {
			              $scope.all_valid = true;
		            }
	          } else {
		            controller.common.resetMap();
		            $scope.all_valid = false;
		            TaxiRide.role = null;

		            if($ionicHistory.backView()) {
			              $ionicHistory.goBack(-999);
		            } else {
			              $state.go("home");
		            }
	          }

	          return $scope.all_valid ? $q.resolve() : $q.reject();
        };

        var removeSideMenu = angular.noop;
        var showMenu = null;

        this.addMenu = function() {
            removeSideMenu = ContextualMenu.set("modules/taxi_ride/templates/l1/contextual-menu.html", 120, function() {
                return showMenu;
            });
            showMenu = true;
        };

        this.loadGMap = function() {
            $scope.is_loading = false; // Not showing the map div could interfere with map tile rendering

            if($scope.loadedGMap && !$scope.map && _.isObject(google) && _.isObject(google.maps)) {
                // If scope has been destroyed but everything is loaded
                controller.common.initMap();
            } else {
                GoogleMaps.addCallback(controller.common.initMap);
                $scope.loadedGMap = true;
            }
        };

        this.redrawMap = function() {
            try { google.maps.event.trigger($scope.map,'resize'); } catch(e) { }
        };

        var resetMapListeners = [];

        this.resetMap = function() {
            _.forEach(resetMapListeners, function(f) {
                if(_.isFunction(f)) { f(); }
            });

            $scope.map = null;
            $scope.dropOffMarker = null;
            $scope.driverMarker = null;
            $scope.pickUpMarker = null;
        };

        this.zoomIfNeeded = function() {
            if($scope.map) {
                if($scope.map.getZoom() < (($scope.has_request) ? 17 : 14)) {
                    $scope.map.setZoom(($scope.has_request) ? 19 : 16);
                }
            }
        };

        var lastLocationUpdate = 0;
        var lastLocationCoords = {};
        this.updateLocation = function(result) {
            if(($scope.passenger || $scope.isDriverOnline) && lastLocationUpdate < result.timestamp) {
                if($scope.driver) {
                    // We update position of driver via GPS, but passenger is update via the pickup pinpoint
                    TaxiRide.driver.updatePosition(result.timestamp, result.coords);
                } else {
                    if($scope.has_request) {
                        TaxiRide.passenger.updatePosition(result.timestamp, result.coords);
                    } else {
                        if(
                            (+_.get(lastLocationCoords, "latitude")).toFixed(5) !== (+_.get(result, "coords.latitude")).toFixed(5) || (+_.get(lastLocationCoords, "longitude")).toFixed(5) !== (+_.get(result, "coords.longitude")).toFixed(5)
                        ) {
                            controller.passenger.updatePickupInfos();
                        }
                    }
                }
                lastLocationCoords = result.coords;

                var pos = new google.maps.LatLng(result.coords.latitude, result.coords.longitude);

                if(!$scope.map_moved_by_user || lastLocationUpdate === 0) {
                    if($scope.passenger && $scope.ride.pickup_lat !== null && $scope.ride.pickup_long != null)
                        return;

                    $scope.map.panTo(pos);
                    controller.common.zoomIfNeeded();
                }

                lastLocationUpdate = result.timestamp;

                if(!$scope.myLocationMarker) {
                    var marker = {
                        latitude: result.coords.latitude,
                        longitude: result.coords.longitude,
                        icon: {
                            url: $scope.driver ? $scope.my_driver_token : $scope.user_token,
                            height: 60,
                            width: 60
                        },
                        markerOptions: {
                            icon: {
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(30, 30)
                            }
                        }
                    };
                    $scope.myLocationMarker = GoogleMaps.addMarker(marker);
                } else {
                    $scope.myLocationMarker.setPosition(pos);
                }
            }
        };

        $scope.locationInterval = null;

        this.startLocationUpdates = function() {
            lastLocationUpdate = 0;
            $scope.locationWatcher = $cordovaGeolocation.watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
            $scope.locationWatcher.then(null, console.error.bind(console), controller.common.updateLocation);
            $scope.locationInterval = $interval(function() {
                if(_.isNumber(lastLocationCoords.latitude)) {
                    var now = (+new Date());
                    if(lastLocationUpdate+5000 < now) { // If we have no new coordinates before 5 seconds, send old coordinates
                        controller.common.updateLocation({timestamp: now, coords: lastLocationCoords});
                    }
                }
            }, 5000);
        };

        this.stopLocationUpdates = function() {
            if(_.isObject($scope.locationWatcher) && _.isFunction($scope.locationWatcher.clearWatch))
                $scope.locationWatcher.clearWatch();
            $scope.locationWatcher = null;

            if(_.isObject($scope.myLocationMarker)) {
                if(_.isFunction($scope.myLocationMarker.setMap))
                    $scope.myLocationMarker.setMap(null);
                $scope.myLocationMarker = null;
            }

            if($scope.locationInterval !== null)
                $interval.cancel($scope.locationInterval);
        };

        this.initMap = function() {
            resetMapListeners.push(
                $scope.$on("$ionicView.loaded", controller.common.redrawMap)
            );
            resetMapListeners.push(
                $scope.$on("$ionicView.afterEnter", controller.common.redrawMap)
            );

            $scope.map = GoogleMaps.createMap('map', MAP_OPTIONS);

            var mapMovedByUser = function() {
                $timeout(function() {
                    $scope.map_moved_by_user = true;
                });
            };

            $scope.$on(GoogleMaps.USER_INTERACTED_EVENT, mapMovedByUser);

            if(/^(passenger|driver)$/.test($scope.role)) {
                if(_.isFunction(controller[$scope.role].initMap)) {
                    controller[$scope.role].initMap();
                }
            }

            $ionicLoading.show({
                template: "<ion-spinner class=\"spinner-custom\"></ion-spinner>"
            });

            $scope.restoreTimeout = $timeout(function() {
                $ionicLoading.hide();
            }, 10000);

            $timeout(function() {
                controller.common.redrawMap();
                $scope.initedGmap = true;

                //reload current request
                TaxiRide.restoreCurrentRequest().then(null, function() {
                    if(_.isObject($scope.restoreTimeout)) {
                        $timeout.cancel($scope.restoreTimeout);
                    }
                    $ionicLoading.hide();
                });
            }, 1001);

        };

        this.loadContent = function() {
            $scope.page_title = TaxiRide.page_title;

            controller.common.addMenu();

            TaxiRide.infosForCustomer(true).then(function(data) {
                $scope.user = data;
                $scope.role = data.role;
                $scope.driver = $scope.role == "driver";
                $scope.passenger = $scope.role == "passenger";
                controller.common.checkCustomer();
            }, function() {
                // console.error.apply(this, arguments);
            }).finally(function() {
                controller.common.loadGMap();

                if(_.isFunction(controller.passenger.loadContent))
                    controller.passenger.loadContent();

                if(_.isFunction(controller.driver.loadContent))
                    controller.driver.loadContent();

                $scope.is_loading = false;
            });
        };

        var postInit = function() {
            // We can't use $ionicView events : unreliable
            $scope.$on("$stateChangeSuccess", function(event, toState) {
                if(_.get(toState, "name") == "taxi_ride-map") {
                    controller.common.loadContent();
                    if(_.isFunction(_.get(window, "plugins.insomnia.keepAwake"))) {
                        window.plugins.insomnia.keepAwake();
                    }
                } else {
                    removeSideMenu();
                    showMenu = false;
                    if(_.isFunction(_.get(window, "plugins.insomnia.allowSleepAgain"))) {
                        window.plugins.insomnia.allowSleepAgain();
                    }
                }
            });
            $scope.$on(AUTH_EVENTS.loginSuccess, controller.common.checkCustomer);
            $scope.$on(AUTH_EVENTS.logoutSuccess, controller.common.checkCustomer);
            $scope.$on(TaxiRide.RECHECK_CUSTOMER, controller.common.checkCustomer);

            $scope.showSideMenu = function() {
                controller.common.addMenu(); // Just in case
                ContextualMenu.open();
            };

            if(_.isFunction(_.get(window, "plugins.insomnia.keepAwake"))) {
                window.plugins.insomnia.keepAwake();
            }

            $scope.is_loading = false;
        };

        this.init = function() {
            $scope.is_loading = true;
            $scope.is_loading = true;
            $scope.preInit = false;

            $scope.pickup_pin = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/pickup.png";
            $scope.dropoff_pin = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/dropoff.png";
            $scope.user_token = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/user.png";
            $scope.driver_token = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/driver.png";
            $scope.my_driver_token = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/my_driver.png";
            $scope.driver_pin = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/driver_pin.png";

            $scope.myLocationMarker = null;
            $scope.myDriverMarker = null;
            $scope.all_valid = false;

            $scope.map_moved_by_user = true;

            $scope.centerWithGPS = function(really_use_gps) {
                $scope.map_moved_by_user = false;

                if(_.isObject($scope.myLocationMarker) && !really_use_gps) {
                    GoogleMaps.map.panTo($scope.myLocationMarker.getPosition());
                } else {
                    GoogleMaps.setCenter();
                    controller.common.stopLocationUpdates();
                    controller.common.startLocationUpdates();
                };

                controller.common.zoomIfNeeded();

                if($scope.passenger) {
                    controller.passenger.updatePickupInfos();
                    TaxiRide.passenger.goOnline();
                }
            };

            var bootstrap = function() {
                controller.passenger.init();
                controller.driver.init();
                controller.common.loadContent();
                postInit();
            };

            if(!TaxiRide.loaded) {
                TaxiRide.load().then(bootstrap);
            } else {
                bootstrap();
            }

            $scope.current_request = null;
            $scope.request_is_ongoing = false;
            $scope.request_is_accepted = false;
            $scope.has_request = false;
            $scope.$on(TaxiRide.REQUEST_UPDATED, function() {
                if(_.isObject($scope.restoreTimeout)) {
                    $timeout.cancel($scope.restoreTimeout);
                }

                var just_removed_request = _.isObject($scope.current_request) && !_.isObject(TaxiRide.current_request);
                $scope.current_request = TaxiRide.current_request;
                $scope.request_is_accepted = _.get($scope.current_request, "status") === "accepted";
                $scope.request_is_ongoing = _.get($scope.current_request, "status") === "going";
                $scope.has_request = _.isObject($scope.current_request) && _.includes(["going", "accepted"], $scope.current_request.status);

                if(!$scope.has_request) {
                    $scope.contact_phone = null;

                    if (_.isObject($scope.directionsRenderer)) {
                        $scope.directionsRenderer.setMap(null);
                        $scope.directionsRenderer = null;
                    }

                    GoogleMaps.removeMarker($scope.driverMarker);
                    if(just_removed_request) {
                        GoogleMaps.removeMarker($scope.pickUpMarker);
                        GoogleMaps.removeMarker($scope.dropOffMarker);
                        $scope.ride = {};
                        $timeout(function() {
                            $scope.centerWithGPS(true);
                            $scope.getCurrentAddress();
                        }, 500);
                    }
                } else {
                    controller.common.stopLocationUpdates();

                    if($scope.driver) {
                        $scope.goOnline();
                    } else {
                        TaxiRide.passenger.goOnline();
                    }
                    controller.common.startLocationUpdates();
                    $scope.centerWithGPS();

                    $scope.contact_phone = $scope.driver ? $scope.current_request.customer_phone : $scope.current_request.driver_phone;

                    var driver = {position: {lat: $scope.current_request.driver_start_lat, lng: $scope.current_request.driver_start_lng}};

                    var base_marker = {
                        icon: {
                            height: 60,
                            width: 60
                        },
                        markerOptions: {
                            animation: google.maps.Animation.DROP,
                            icon: {
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(14, 60)
                            }
                        }
                    };

                    var pickup_marker = _.merge({}, base_marker, {
                        latitude: $scope.current_request.pickup_lat,
                        longitude: $scope.current_request.pickup_long,
                        icon: {
                            url: $scope.pickup_pin
                        }
                    });

                    function showRouteAndMarkers(route) {

                        // Clear past routes
                        if (_.isObject($scope.directionsRenderer)) {
                            $scope.directionsRenderer.setMap(null);
                            $scope.directionsRenderer = null;
                        }

                        $scope.directionsRenderer = new google.maps.DirectionsRenderer({
                            suppressMarkers: true,
                            suppressInfoWindows: true,
                            suppressBicyclingLayer: true
                        });

                        GoogleMaps.addRoute(route, $scope.directionsRenderer);
                        $timeout(function() {
                            google.maps.event.trigger($scope.map, 'resize');

                            if($scope.request_is_accepted) {
                                if(!$scope.driverMarker) {
                                    $scope.driverMarker = GoogleMaps.addMarker(driver_marker);
                                } else {
                                    $scope.driverMarker = GoogleMaps.replaceMarker($scope.driverMarker, driver_marker);
                                }

                                if(_.isObject($scope.dropOffMarker)) {
                                    GoogleMaps.removeMarker($scope.dropOffMarker);
                                }

                            } else if ($scope.request_is_ongoing) {
                                if(_.isObject($scope.driverMarker)) {
                                    GoogleMaps.removeMarker($scope.driverMarker);
                                }

                                var end_location = _.get(_.last(_.get(route, "routes[0].legs")), "end_location");
                                var route_dropoff_marker = _.merge({}, base_marker, {
                                    latitude: end_location.lat(),
                                    longitude: end_location.lng(),
                                    icon: {
                                        url: $scope.dropoff_pin
                                    }
                                });

                                if(!$scope.dropOffMarker) {
                                    $scope.dropOffMarker = GoogleMaps.addMarker(route_dropoff_marker);
                                } else {
                                    $scope.dropOffMarker = GoogleMaps.replaceMarker($scope.dropOffMarker, route_dropoff_marker);
                                }
                            }

                            if(!$scope.pickUpMarker) {
                                $scope.pickUpMarker = GoogleMaps.addMarker(pickup_marker);
                            } else {
                                $scope.pickUpMarker = GoogleMaps.replaceMarker($scope.pickUpMarker, pickup_marker);
                            }

                            if(_.isFunction(_.get($scope.pickUpMarker, "setOpacity"))) {
                                $scope.pickUpMarker.setOpacity(1.0);
                            }

                        }, 1000);

                        // Re center map
                        $timeout(function() {
                            google.maps.event.trigger($scope.map, 'resize');
                        }, 500);
                    }

                    if($scope.request_is_accepted) {
                        var driver_marker = _.merge({}, base_marker, {
                            latitude: driver.position.lat,
                            longitude: driver.position.lng,
                            icon: {
                                url: $scope.driver_pin
                            }
                        });

                        TaxiRide.calculateRoute(
                            driver.position,
                            {
                                lat: $scope.current_request.pickup_lat,
                                lng: $scope.current_request.pickup_long
                            }
                        ).then(function(route) {
                            showRouteAndMarkers(route);
                        });
                    }

                    if($scope.request_is_ongoing) {
                        var dropoff_marker = _.merge({}, base_marker, {
                            latitude: $scope.current_request.dropoff_lat,
                            longitude: $scope.current_request.dropoff_long,
                            icon: {
                                url: $scope.dropoff_pin,
                                height: 30,
                                width: 30
                            },
                            markerOptions: {
                                icon: {
                                    anchor: new google.maps.Point(7, 30)
                                }
                            }
                        });

                        TaxiRide.calculateRoute(
                            {
                                lat: $scope.current_request.pickup_lat,
                                lng: $scope.current_request.pickup_long
                            },
                            {
                                lat: $scope.current_request.dropoff_lat,
                                lng: $scope.current_request.dropoff_long
                            }
                        ).then(function(route) {
                            showRouteAndMarkers(route);
                        });

                    }
                }
            });

        };

        return this;
    })();

    controller.passenger = new (function passenger(){

        $scope.showGoBtn = false;
        $scope.route_error = false;

        var calculateRoute = function() {
            $scope.showGoBtn = false;

            if(has_4coords()) {
                GoogleMaps.calculateRoute({
                    latitude: $scope.ride.pickup_lat,
                    longitude: $scope.ride.pickup_long
                }, {
                    latitude: $scope.ride.dropoff_lat,
                    longitude: $scope.ride.dropoff_long
                }, {
                    mode: google.maps.DirectionsTravelMode.DRIVING,
                    unitSystem: TaxiRide.distance_unit === "km" ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL
                }, true).then(function(route) {
                    if(_.isObject(route) && _.isArray(route.routes) && route.routes.length > 0) {
                        $timeout(function() {
                            $scope.ride.route = route.routes[0];
                            $scope.showGoBtn = true;
                            $scope.route_error = false;
                        });
                    }
                }, function(args) {
                    var response = null,
                        status = null;

                    if(_.isArray(args)) {
                        if(args.length > 0)
                            response = args.shift();
                        if(args.length > 0)
                            status = args.shift();
                    }

                    if(status === "ZERO_RESULTS" || status === "NOT_FOUND") {
                        $scope.showGoBtn = false;
                        $scope.route_error = true;
                    }
                });
            }
        };

        $scope.getCurrentAddress = _.debounce(function() {
            if($scope.has_request)
                return;

            var center = GoogleMaps.map.center;

            TaxiRide.passenger.updatePosition((+new Date()), {
                latitude: center.lat(),
                longitude: center.lng()
            });

            GoogleMaps.reverseGeocode({
                latitude: center.lat(),
                longitude: center.lng()
            }).then(function(results) {
                if(_.isArray(results) && results.length > 0 && _.isObject(results[0]) && _.isString(results[0].formatted_address)) {
                    $timeout(function() {
                        $scope.center_address =
                            $scope.ride.pickup_address = results[0].formatted_address;

                        var marker = {
                            latitude: center.lat(),
                            longitude: center.lng(),
                            icon: {
                                url: $scope.pickup_pin,
                                height: 60,
                                width: 60
                            },
                            markerOptions: {
                                animation: null,
                                icon: {
                                    origin: new google.maps.Point(0, 0),
                                    anchor: new google.maps.Point(14, 60)
                                }
                            }
                        };

                        if(!$scope.pickUpMarker) {
                            $scope.pickUpMarker = GoogleMaps.addMarker(marker);
                        } else {
                            $scope.pickUpMarker = GoogleMaps.replaceMarker($scope.pickUpMarker, marker);
                        }

                        if(_.isObject($scope.pickUpMarker) && _.isFunction($scope.pickUpMarker.setOpacity))
                            $scope.pickUpMarker.setOpacity(0.5);

                        calculateRoute();
                    });
                }
            });
        }, 1000);

        $scope.disableTap = function(el_id){
            container = document.getElementsByClassName('pac-container');
            // disable ionic data tab
            angular.element(container).attr('data-tap-disabled', 'true');
            // leave input field if google-address-entry is selected
            angular.element(container).on("click", function(){
                document.getElementById(el_id).blur();
            });
        };

        this.updatePickupInfos = _.debounce(function() {
            var center = GoogleMaps.map.center;

            $scope.ride.pickup_lat = center.lat();
            $scope.ride.pickup_long = center.lng();

            $timeout(function() {
                $scope.ride.pickup_address = $translate.instant("Go to pinpoint");
            });

            $scope.getCurrentAddress();
        }, 250);

        this.initMap = function() {
            GoogleMaps.map.addListener('center_changed', controller.passenger.updatePickupInfos);

            $scope.centerWithGPS();
        };

        this.init = function() {
            $scope.ride = {};
            $scope.ride.pickup_lat = $scope.ride.pickup_long = null;

            $scope.driversTokens = {};

            function addOrUpdateDriverMarker(e, data) {
                var isMyDriver = (($scope.has_request) && (+TaxiRide.current_request.driver_customer_id === +data.id));
                var token = $scope.driversTokens[+data.id];

                if(_.isObject(token) && _.isFunction(token.setPosition)) {
                    token.setPosition(data.position);
                } else {
                    token = $scope.driversTokens[+data.id] = GoogleMaps.addMarker({
                        latitude: data.position.lat,
                        longitude: data.position.lng,
                        icon: {
                            url: $scope.driver_token,
                            height: 60,
                            width: 60
                        },
                        markerOptions: {
                            icon: {
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(30, 30)
                            }
                        }
                    });
                }

                var token_icon = token.getIcon();

                if(isMyDriver) {
                    if(token_icon.url != $scope.my_driver_token) {
                        token.setIcon(_.merge(token_icon, { url: $scope.my_driver_token }));
                    }

                    $scope.myDriverMarker = token;
                } else {
                    if(token_icon.url == $scope.my_driver_token) {
                        token.setIcon(_.merge(token_icon, { url: $scope.driver_token }));
                    }

                    // Reset var if it's still this token
                    if($scope.myDriverMarker === token)
                        $scope.myDriverMarker = null;
                }
            }

            function removeDriverMarker(e, data) {
                var token = $scope.driversTokens[data.id];
                if(_.isObject(token) && _.isFunction(token.setPosition)) {
                    GoogleMaps.removeMarker(token);
                    delete $scope.driversTokens[+data.id];
                }
            }

            $scope.$on(TaxiRide.MAP_EVENTS.DRIVERS_MAP_UPDATED, function(e, newDrivers) {
                _.forEach(_.keys($scope.driversTokens), function(d_id) {
                    if(!_.includes(_.keys(newDrivers), d_id)) { // If driver is not present anymore
                        removeDriverMarker(e, { id: +d_id }); // remove it
                    }
                });

                _.forEach(newDrivers, function(d) {
                    addOrUpdateDriverMarker(e, d);
                });
            });

            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_APPEARED, addOrUpdateDriverMarker);
            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_UPDATED, addOrUpdateDriverMarker);
            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_DISAPPEARED, removeDriverMarker);

            $scope.setPickUp = _.debounce(function(event) {
                if($scope.has_request)
                    return $q.reject();

                if((event === true || event.keyCode === 13) && $scope.center_address != $scope.ride.pickup_address) {
                    var q = $q.defer();

                    $timeout(function() {
                        return GoogleMaps.geocode($scope.ride.pickup_address).then(function(pos) {
                            if(_.isObject(pos) && _.isNumber(pos.latitude)) {
                                GoogleMaps.setCenter(pos);
                                controller.common.zoomIfNeeded();
                            }
                            q.resolve();
                        }, function(err) {
                            if(_.isString(err) && err.length > 0)
                                SafePopups.show('show', {
                                    subTitle: err,
                                    buttons: [{
                                        text: $translate.instant("OK")
                                    }]
                                });
                            q.reject(err);
                        });
                    }, event === true ? 0 : 500);
                    return q.promise;
                }

                return _.isString($scope.center_address) && $scope.center_address.trim().length > 0 &&
                    $scope.ride.pickup_address  === $scope.center_address ? $q.resolve() : $q.reject();
            }, 800);

            $scope.setDropOff = _.debounce(function(event) {

                if($scope.has_request)
                     return $q.reject();

                if((event === true || event.keyCode === 13) && $scope.dropoff_address != $scope.ride.dropoff_address) {
                    var q = $q.defer();
                    $timeout(function() {
                        if(_.isString($scope.ride.dropoff_address) && $scope.ride.dropoff_address.trim() === "") {
                            $scope.ride.route = 
                                $scope.dropoff_address = 
                                $scope.ride.dropoff_lat = $scope.ride.dropoff_long = null;

                            if($scope.dropOffMarker)
                                GoogleMaps.removeMarker($scope.dropOffMarker);

                            if($scope.driverMarker)
                                GoogleMaps.removeMarker($scope.driverMarker);

                            $scope.showGoBtn = false;
                            $scope.route_error = false;

                            return q.resolve();
                        } else {
                            return GoogleMaps.geocode($scope.ride.dropoff_address).then(function(pos) {
                                if(_.isObject(pos) && _.isNumber(pos.latitude)) {
                                    $scope.ride.dropoff_lat = pos.latitude;
                                    $scope.ride.dropoff_long = pos.longitude;

                                    GoogleMaps.reverseGeocode(pos).then(function(results) {
                                        if(_.isArray(results) && results.length > 0 && _.isObject(results[0]) && _.isString(results[0].formatted_address)) {
                                            $timeout(function() {
                                                $scope.dropoff_address =
                                                    $scope.ride.dropoff_address = results[0].formatted_address;
                                            });
                                        }
                                    });


                                    var marker = {
                                        latitude: pos.latitude,
                                        longitude: pos.longitude,
                                        icon: {
                                            url: $scope.dropoff_pin,
                                            height: 60,
                                            width: 60
                                        },
                                        markerOptions: {
                                            animation: google.maps.Animation.DROP,
                                            icon: {
                                                origin: new google.maps.Point(0, 0),
                                                anchor: new google.maps.Point(14, 60)
                                            }
                                        }
                                    };

                                    if(!$scope.dropOffMarker) {
                                        $scope.dropOffMarker = GoogleMaps.addMarker(marker);
                                    } else {
                                        $scope.dropOffMarker = GoogleMaps.replaceMarker($scope.dropOffMarker, marker);
                                    }

                                    calculateRoute();
                                }
                                return q.resolve();
                            }, function(err) {
                                if(_.isString(err) && err.length > 0)
                                    SafePopups.show('show', {
                                        subTitle: err,
                                        buttons: [{
                                            text: $translate.instant("OK")
                                        }]
                                    });

                                $scope.ride.route = 
                                    $scope.dropoff_address = 
                                    $scope.ride.dropoff_lat = $scope.ride.dropoff_long = null;

                                if($scope.dropOffMarker)
                                    GoogleMaps.removeMarker($scope.dropOffMarker);

                                if($scope.driverMarker)
                                    GoogleMaps.removeMarker($scope.driverMarker);
                            });
                        }
                    }, event === true ? 0 : 500);
                    return q.promise;
                }

                return _.isString($scope.dropoff_address) && $scope.dropoff_address.trim().length > 0 &&
                        $scope.dropoff_address  === $scope.ride.dropoff_address ? $q.resolve() : $q.reject();

            }, 800);

        };

        $scope.showFloatingInfos = function() {
            $scope.setPickUp(true).then(function() {
                return $scope.setDropOff(true);
            }).then(function() {
                controller.common.checkCustomer(true).then(function() {
                    if($scope.all_valid && has_4coords()) {
                        TaxiRide.showEstimateModal($scope.ride);
                    }
                });
            });
        };


        var create_destroy_event = true;
        this.loadContent = function() {
            if($scope.passenger) {
                controller.common.stopLocationUpdates();
                controller.common.startLocationUpdates();
                TaxiRide.passenger.goOnline();

                if(create_destroy_event) {
                    create_destroy_event = false;
                    $scope.$on("$destroy", TaxiRide.passenger.goOffline);
                }
            }
        };

        return this;
    })();

    controller.driver = new (function driver() {

        this.init = function() {
            $scope.user = {};
            $scope.accepted = false;
            $scope.accepted_waiting = true;
            $scope.locationWatcher = null;
            $scope.isDriverOnline = false;

            $scope.goOnline = function() {
                controller.common.checkCustomer();
                $scope.isDriverOnline = true;
                TaxiRide.driver.goOnline();
                controller.common.startLocationUpdates();
            };

            $scope.goOffline = function() {
                $scope.isDriverOnline = false;
                TaxiRide.driver.goOffline();
                controller.common.stopLocationUpdates();
                $scope.map.setCenter(MAP_OPTIONS.center);
                $scope.map.setZoom(MAP_OPTIONS.zoom);
            };

        };

        var create_destroy_event = true;
        this.loadContent = function() {
            if($scope.driver) {
                $scope.accepted_waiting = $scope.user.driver_accepted_waiting;
                $scope.accepted = $scope.user.driver_accepted;
                if(create_destroy_event) {
                    create_destroy_event = false;
                    $scope.$on("$destroy", $scope.goOffline);
                }
            }
        };

        this.initMap = function() {
            var autoResetMap = false;
            if(autoResetMap) {
                var resetMapCenterAfterMove = _.debounce(function() {
                    $timeout(function() {
                        if(_.isObject($scope.myLocationMarker)) {
                            $scope.map_moved_by_user = false;
                            $scope.map.panTo($scope.myLocationMarker.getPosition());
                            controller.common.zoomIfNeeded();
                        }
                    });
                }, 5000);

                $scope.$on(GoogleMaps.USER_INTERACTED_EVENT, resetMapCenterAfterMove);
            }
        };

        return this;

    })();


    /* TODO: CLEAN. This should be inside subobjects driver or passenger for clarity */
    $scope.cancelStatus = function() {
        SafePopups.show("show",{
            title: '<div class="bar-assertive">'+$translate.instant('Are you sure?')+'</div>',
            template: '<i class="icon ion-alert-circled"></i> '+
                    $translate.instant('This action cannot be reverted!')+
                    '<br>'+
                    $translate.instant("Are you sure to cancel ride?"),
            buttons: [{
                text: $translate.instant("Close")
            },{
                text: $translate.instant("Cancel ride"),
                onTap: function() {
                    TaxiRide.updateStatus(TaxiRide.current_request, 'cancelled');
                },
                type: 'button-assertive'
            }]
        });
    };

    $scope.finishStatus = function() {
        var options = {
            title: '<div class="bar-assertive">'+$translate.instant('Are you sure?')+'</div>',
            template: $translate.instant("Are you sure to finish ride?"),
            buttons: [{
                text: $translate.instant("Close")
            }]
        };

        if(TaxiRide.allow_manual_prices) {
            $scope.final_popup = {final_price: null};
            options.template = $translate.instant("Please enter final price to finish ride :") + "<br>" +
                "<input autofocus type=\"number\" ng-model=\"final_popup.final_price\">";
            options.scope = $scope;
            options.buttons.push({
                text: $translate.instant("Set price and finish ride"),
                type: 'button-balanced',
                onTap: function() {
                    var final_price =  parseFloat($scope.final_popup.final_price);
                    if(isNaN(final_price) || final_price < 0) {
                        SafePopups.show("alert", {
                            title: $translate.instant("Incorrect price"),
                            template: ($translate.instant("Final price can't be negative and format should use only dot and numbers. e.g. : 1234.56"))
                        }).then($scope.finishStatus);
                    } else {
                        TaxiRide.updateStatus(TaxiRide.current_request, 'finished', final_price);
                    }
                }
            });
        } else {
            options.buttons.push({
                text: $translate.instant("Finish ride"),
                onTap: function() {
                    TaxiRide.updateStatus(TaxiRide.current_request, 'finished');
                },
                type: 'button-balanced'
            });
        }

        var popup = SafePopups.show(
            "show", // Cannot use prompt because OF REASONS. IONIC REASONS
            options
        );

    };

    $scope.startRide = function() {
        SafePopups.show("show",{
            title: '<div class="bar-assertive">'+$translate.instant('Are you sure?')+'</div>',
            template: $translate.instant("Are you sure to start this ride?"),
            buttons: [{
                text: $translate.instant("Close")
            },{
                text: $translate.instant("Start ride"),
                onTap: function() {
                    TaxiRide.updateStatus(TaxiRide.current_request, 'going');
                },
                type: 'button-balanced'
            }]
        });
    };
    /* END TODO: CLEAN */

    (function preInit() {
        $scope.preInit = true;
        $value_id = TaxiRide.value_id = $stateParams.value_id;

        $scope.login = function() { Customer.loginModal(); };

        $scope.selected_role = null;
        $scope.selectRole = function(role) { $scope.selected_role = role; $scope.continue(); };

        $scope.continue = function() {
            if($scope.must_login) {
                Customer.loginModal();
            } else {
                if($scope.selected_role === null) {
                    $scope.is_loading = true;
                    return TaxiRide.roleForCustomer().then(function(role) {
                        TaxiRide.role = $scope.selected_role = role;
                    }, function(args) {
                        if(_.isArray(args)) {
                            console.error.apply(this, ["[Error from TaxiRide.roleForCustomer]"].concat(args));
                        } else {
                            console.error("[Error from TaxiRide.roleForCustomer]", args);
                        }
                    }).finally(function(){
                        $scope.is_loading = false;
                        if($scope.selected_role !== null) {
                            $scope.continue();
                        }
                    });
                } else if(/driver|passenger/i.test($scope.selected_role)) {
                    if (TaxiRide.role != $scope.selected_role) {
                        $scope.is_loading = true;
                        return TaxiRide.setRoleForCustomer($scope.selected_role).then(function(role) {
                            TaxiRide.role = $scope.selected_role = role;
                            $scope.continue();
                        }, function() { console.log("error"); }).finally(function() {
                            $scope.is_loading = false;
                        });
                    } else {
                        controller.common.init();
                    }
                }
            }
        };

        var firstLoad = function() {
            $scope.page_title = TaxiRide.page_title;
            $scope.must_login = true;

            var checkLoginStatus = function(event, loggedIn) {
                if(!$scope.must_login && !loggedIn) {
                    // We just logged out, we need to reload
                    $state.reload();
                } else {
                    $scope.is_loading = false;
                    $scope.selected_role = TaxiRide.role;
                    $scope.must_login = !loggedIn;
                    if(loggedIn) {
                        $scope.continue();
                    }
                }
            };

            $scope.$on(AUTH_EVENTS.loginStatusChanged, checkLoginStatus);
            $scope.$on("$ionicView.enter", function() {
                checkLoginStatus(null, Customer.isLoggedIn());
            });

            checkLoginStatus(null, Customer.isLoggedIn());
        };

        $scope.is_loading = true;
        if(!TaxiRide.loaded) {
            TaxiRide.load().then(firstLoad);
        } else {
            firstLoad();
        }

    }());

}).controller("TaxiRideMapSideMenuController", function(_, $scope, ContextualMenu, Customer, TaxiRide, HomepageLayout) {

    HomepageLayout.getFeatures().then(function (features) {
        $scope.my_account_icon = _.get(_.find(_.get(features, "options"), {code: "tabbar_account"}), "icon_url");
    });

    $scope.showPaymentsSettings = function() {
        ContextualMenu.close();
        TaxiRide.showPaymentsSettingsModal();
    };

    $scope.showSettings = function() {
        ContextualMenu.close();
        TaxiRide.showCustomFieldsModal();
    };

    $scope.showMyAccount = function() {
        ContextualMenu.close();
        Customer.loginModal();
    };

    $scope.showHistorySettings = function() {
        ContextualMenu.close();
        TaxiRide.showHistoryModal();
    }
});
