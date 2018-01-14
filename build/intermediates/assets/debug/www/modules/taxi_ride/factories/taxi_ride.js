App.factory('TaxiRide', function(_, $cordovaLocalNotification, $filter, $http, $interval, $ionicLoading, $ionicModal, $ionicPlatform, $q, $rootScope, $state, $translate, $timeout, $window, Application, Customer, GoogleMaps, Url, SafePopups, AUTH_EVENTS) {

    var TAXIRIDE_LOCAL_NOTIFICATION_ID = 100;

    var factory = {};


    $rootScope.$on('$cordovaLocalNotification:click', function(event, notification, state) {
        if(!!_.get(notification, "data.taxiride")) {
            $state.go("taxi_ride-map", {value_id: factory.value_id});
            cancelTaxiRideNotification();
        }
    });

    function cancelTaxiRideNotification() {
        try {
            $cordovaLocalNotification.cancel([TAXIRIDE_LOCAL_NOTIFICATION_ID]);
        } catch(e) {
            console.error("error cancelling taxiride notification");
        }
    }

    $ionicPlatform.on('resume', cancelTaxiRideNotification);

    factory.CUSTOM_FIELDS_MODAL_STATE_UPDATE = "taxiride_custom_fields_modal_state_update";
    factory.PAYMENTS_SETTINGS_MODAL_STATE_UPDATE = "taxiride_payments_settings_modal_state_update";
    factory.DRIVER_ACCEPTED_REQUEST = "taxiride_driver_accepted_request";
    factory.REQUEST_UPDATED = "taxiride_request_updated";
    factory.MAP_EVENTS = {
        DRIVER_APPEARED: "taxiride_driver_appeared",
        DRIVER_UPDATED: "taxiride_driver_updated",
        DRIVER_DISAPPEARED: "taxiride_driver_disappeared",
        DRIVERS_MAP_UPDATED: "taxiride_drivers_map_updated"
    };

    var _customers = {};
    var _vehicule_types = null;

    var positionBuffer = (new (function PositionsBuffer() {

        function getPositionsBuffer() {
            var _positionsBuffer = $window.localStorage.getItem("sb-taxiride-positions-buffer");
            try {
                _positionsBuffer = JSON.parse(_positionsBuffer);
            } catch(e) {
                if(!(_.isObject(e) && e.name === "SyntaxError" && (e.message.indexOf("JSON") >= 0 || e.message.indexOf("Unexpected end of input") >= 0))) {
                    throw e;
                }
            }

            if(!_.isObject(_positionsBuffer))
                _positionsBuffer = {};

            return _positionsBuffer;
        }

        function setPositionsBuffer(buffer) {
            if(_.isObject(buffer)) {
                $window.localStorage.setItem("sb-taxiride-positions-buffer", JSON.stringify(buffer));
                return buffer;
            }
            return {};
        }

        function removeFromPositionBuffer(driverOrPassenger, request, data) {
            var _positionsBuffer = getPositionsBuffer();

            if(!_.isObject(_positionsBuffer[driverOrPassenger])) {
                _positionsBuffer[driverOrPassenger] = {};
            }

            if(!_.isObject(_positionsBuffer[driverOrPassenger][request])) {
                _positionsBuffer[driverOrPassenger][request] = {};
            }

            _positionsBuffer[driverOrPassenger][request][data.gps_timestamp] = undefined;
            delete _positionsBuffer[driverOrPassenger][request][data.gps_timestamp];

            setPositionsBuffer(_positionsBuffer);
        }

        function sendPosition(driverOrPassenger, request, data) {
            if(!(/^driver|passenger$/.test(driverOrPassenger)))
                return $q.reject();

            if(!_.isObject(data))
                return $q.reject();

            return goOnline(driverOrPassenger)().then(function(io) {
                io.emit(driverOrPassenger+".updatePosition", payload(data), function() {
                    removeFromPositionBuffer(driverOrPassenger, request, data);
                });

                return $q.resolve();
            });
        }

        this.addPosition = function addToPositionBuffer(driverOrPassenger, request, data) {
            request = +(request || _.get(request, "id") || 0);

            if(!(/^driver|passenger$/.test(driverOrPassenger)))
                return;

            var _positionsBuffer = getPositionsBuffer();

            if(!_.isObject(_positionsBuffer[driverOrPassenger])) {
                _positionsBuffer[driverOrPassenger] = {};
            }

            if(!_.isObject(_positionsBuffer[driverOrPassenger][request])) {
                _positionsBuffer[driverOrPassenger][request] = {};
            }

            _positionsBuffer[driverOrPassenger][request][data.gps_timestamp] = data;

            setPositionsBuffer(_positionsBuffer);
        };

        var _goingOnline = null;
        var _checkInterval = null;

        var sendPositionsInBuffer = function() {
            if( _.isString(factory.role) && /^driver|passenger$/.test(factory.role) ) {
                    if(_.isObject(_goingOnline) && _.isFunction(_goingOnline.then))
                        return;

                    _goingOnline = goOnline(factory.role)().then(function(io) {

                        var req_id = +_.get(factory, "current_request.id", 0);

                        var _positionsBuffer = getPositionsBuffer();

                        // Clean buffer

                        // Remove not corresponding roles
                        _positionsBuffer[factory.role === "driver" ? "passenger" : "driver"] = undefined;
                        delete _positionsBuffer[factory.role === "driver" ? "passenger" : "driver"];


                        if(req_id !== 0) {
                            // remove not corresponding request
                            _positionsBuffer[factory.role] = _.filter(_positionsBuffer[factory.role], function(value, key) {
                                return +key === +req_id;
                            });
                        }

                        setPositionsBuffer(_positionsBuffer);

                        var positions = _.merge(
                            {},
                            _.get(_positionsBuffer, "["+factory.role+"]["+req_id+"]", {}),
                            _.get(_positionsBuffer, "["+factory.role+"][0]", {})
                        );

                        if(_.size(positions) > 0) {
                            $q.all(
                                _.map(positions, function(value, timestamp) {
                                    return sendPosition(factory.role, req_id, value);
                                })
                            ).finally(function() {
                                _goingOnline = null;
                            });
                        } else {
                            _goingOnline = null;
                        }
                    });
                }
        };

        var executeOnce = $interval(function() {
            if( _.isString(factory.role) && /^driver|passenger$/.test(factory.role) ) {
                sendPositionsInBuffer(); // Execute it once when starting the app
                $interval.cancel(executeOnce);
            }
        }, 1000);

        this.startTimer = function() {
            $interval.cancel(_checkInterval);
            _checkInterval = $interval(sendPositionsInBuffer, 3000);
        };

        this.stopTimer = function() {
            $interval.cancel(_checkInterval);
            _checkInterval = _goingOnline = null;
        };

        return this;
    })());

    var CUSTOM_FIELDS = {
        "passenger": [
            {
                label: $translate.instant("Phone"),
                key: "phone",
                type: "tel",
                required: true
            },
            {
                label: $translate.instant("Address"),
                key: "address",
                type: "text",
                required: true
            },
            {
                label: $translate.instant("City"),
                key: "city",
                type: "text",
                required: true
            },
            {
                label: $translate.instant("Zip Code"),
                key: "zipcode",
                type: "text",
                required: false
            },
            {
                label: $translate.instant("Country"),
                key: "country",
                type: "select_country",
                required: true
            },
            {
                label: $translate.instant("State"),
                key: "state",
                type: "select_state",
                required: true
            }
        ]
    };

    CUSTOM_FIELDS["driver"] = CUSTOM_FIELDS["passenger"].concat(
        [
            {
                label: $translate.instant("Vehicle Type"),
                key: "vehicule_type_id",
                type: "vehicule_type",
                required: true
            },
            {
                label: $translate.instant("Vehicle Model"),
                key: "vehicule_model",
                type: "text",
                required: true
            },
            {
                label: $translate.instant("License Number"),
                key: "license_number",
                type: "text",
                required: true
            }
        ]
    );

    var _cf_modal = null;
    var _cf_modal_success = false;
    var _cf_modal_promise = null;

    var _ps_modal = null;
    var _ps_modal_success = false;
    var _ps_modal_promise = null;

    factory.value_id = null;
    factory.role = null;
    factory.current_request = null;

    $rootScope.$on(AUTH_EVENTS.logoutSuccess, function(){
        factory.role = null;
        factory.current_request = null;
    });

    Object.defineProperty(factory, "custom_fields", {
        get: function() {
            return _.get(CUSTOM_FIELDS, "["+factory.role+"]");
        }
    });

    Object.defineProperty(factory, "custom_fields_data", {
        get: function() {
            var data = _.get(_customers, "["+Customer.id+"].custom_fields", {});
            if(!_.isObject(data))
                data = {};

            return _.extend(
                {},
                _.assign.apply(_,
                               _.map(
                                   factory.custom_fields,
                                   function(f) {
                                       var k = {};
                                       k[f.key] = null;
                                       return k;
                                   }
                               )
                              ),
                data
            );
        }
    });

    factory.areCustomFieldsValid = function() {
        return _.get(_customers, "["+Customer.id+"].valid");
    };

    factory.pay = function(request_id) {
        var q = $q.defer();

        var rideIsFinishedAndPaidCallback = function(success, error_message) {
            $ionicLoading.hide();
            if(success) {
                //we trigg for all an update of request
                factory.broadcastRequest(request_id);
                q.resolve();
            } else {
                SafePopups.show("alert",{
                    title: $translate.instant('Error'),
                    template: $translate.instant(error_message)
                });
                q.reject([error_message]);
            }
        };

        $ionicLoading.show({
            template: $translate.instant("Payment in progress") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });
        $http.postForm(
            Url.get(
                "taxiride/mobile_view/pay",
                {
                    value_id: factory.value_id,
                    customer_id: +Customer.id,
                    request_id: request_id
                }
            ),
            {}
        ).success(function(data) {
            if(_.isObject(data) && !!data.success) {
                rideIsFinishedAndPaidCallback(true);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        }).error(function(data) {
            if(data.message) {
                rideIsFinishedAndPaidCallback(false, data.message);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        });

        return q.promise;
    };

    factory.setRideAsPaid = function(request_id) {
        var q = $q.defer();

        var rideIsFinishedAndPaidCallback = function(success, error_message) {
            $ionicLoading.hide();
            if(success) {
                //we trigg for all an update of request
                factory.broadcastRequest(request_id);
                q.resolve();
            } else {
                SafePopups.show("alert",{
                    title: $translate.instant('Error'),
                    template: $translate.instant(error_message)
                });
                q.reject([error_message]);
            }
        };

        $ionicLoading.show({
            template: $translate.instant("Processing") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });
        $http.postForm(
            Url.get(
                "taxiride/mobile_view/setrideaspaid",
                {
                    value_id: factory.value_id,
                    customer_id: +Customer.id,
                    request_id: request_id
                }
            ),
            {}
        ).success(function(data) {
            if(_.isObject(data) && !!data.success) {
                rideIsFinishedAndPaidCallback(true);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        }).error(function(data) {
            if(data.message) {
                rideIsFinishedAndPaidCallback(false,data.message);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        });
        return q.promise;
    };


    factory.showCustomFieldsModal = function(no_escape) {
        if(_cf_modal_promise !== null)
            return _cf_modal_promise;

        var q = $q.defer();
        _cf_modal_promise = q.promise;
        var scope = $rootScope.$new();
        scope.no_escape = !!no_escape;
        _cf_modal_success = false;

        scope.$close = function() {
            if(_.isObject(_cf_modal) && _.isFunction(_cf_modal.remove)) {
                _cf_modal.remove();
            }
        };

        scope.$close();

        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/custom-fields-modal.html', {
            scope: scope,
            animation: 'slide-in-up',
            focusFirstInput: true,
            backdropClickToClose: !no_escape,
            hardwareBackButtonClose: !no_escape
        }).then(function(modal) {
            _cf_modal = modal;
            _cf_modal.show();
            var modalEventListeners = [];
            var modalHidden = function(event, modal) {
                if(modal == _cf_modal) {
                    q[(!!_cf_modal_success) ? "resolve" : "reject"]();
                    _.forEach(modalEventListeners, function(f) {
                        _.isFunction(f) && f();
                    });
                    _cf_modal = _cf_modal_promise = null;
                }
            };
            modalEventListeners.push(scope.$on("modal.hidden", modalHidden));
            modalEventListeners.push(scope.$on(factory.CUSTOM_FIELDS_MODAL_STATE_UPDATE, function(e, s) { _cf_modal_success = (s === true); }));
        });

        return q.promise;
    };

    var history_modal = null;
    var showing_history_modal = false;

    factory.showHistoryModal = function() {
        if(showing_history_modal)
            return;

        showing_history_modal = true;

        var scope = $rootScope.$new();

        scope.$on("modal.hidden", function(e, modal) {
            if(modal === history_modal) {
                showing_history_modal = false;
            }
        });
        scope.$close = function() {
            if(_.isObject(history_modal) && _.isFunction(history_modal.remove)) {
                history_modal.remove();
                history_modal = null;
            }
        };


        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/history-modal.html', {
            scope: scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            history_modal = modal;
            history_modal.show();
        });
    };

    var showing_estimate_modal = false;
    var estimate_modal = null;

    factory.showEstimateModal = function(ride) {
        if(showing_estimate_modal)
            return;

        showing_estimate_modal = true;

        var scope = $rootScope.$new();
        scope.ride = ride;

        scope.$close = function() {
            if(_.isObject(estimate_modal) && _.isFunction(estimate_modal.remove)) {
                estimate_modal.remove();
                estimate_modal = null;
            }
        };

        scope.$on("modal.hidden", function(e, modal) {
            if(modal === estimate_modal) {
                showing_estimate_modal = false;
            }
        });


        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/estimate-ride-modal.html', {
            scope: scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            estimate_modal = modal;
            estimate_modal.show();
        });
    };

    var driver_modal = null;
    var showing_driver_modal = false;

    factory.showDriverWaitingModal = function(request) {
        if(showing_driver_modal)
            return;

        showing_driver_modal = true;

        var scope = $rootScope.$new();
        scope.request = request;
        scope.original_scope = scope;

        scope.$close = function() {
            if(_.isObject(driver_modal) && _.isFunction(driver_modal.remove)) {
                driver_modal.remove();
                driver_modal = null;
            }
        };

        scope.$on("modal.hidden", function(e, modal) {
            if(modal === driver_modal) {
                if(scope.has_launched_request === false) {
                    factory.updateStatus(request, "cancelled");
                }
                showing_driver_modal = false;
            }
        });

        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/driver-waiting-modal.html', {
            scope: scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            driver_modal = modal;
            driver_modal.show();
        });
    };

    Object.defineProperty(factory, "payments_settings_data", {
        get: function() {
            var data = _.get(_customers, "["+Customer.id+"].payments_settings", {});
            if(!_.isObject(data))
                data = {};

            return data;
        }
    });

    factory.arePaymentsSettingsValid = function() {
        return _.get(_customers, "["+Customer.id+"].payments_valid");
    };

    factory.showPaymentsSettingsModal = function(no_escape) {
        if(_ps_modal_promise !== null)
            return _ps_modal_promise;

        var q = $q.defer();
        _ps_modal_promise = q.promise;
        var scope = $rootScope.$new();
        scope.role = factory.role;
        scope.no_escape = !!no_escape;
        _ps_modal_promise.finally(function(){
            //stub
        });
        _ps_modal_success = false;

        scope.$close = function() {
            if(_.isObject(_ps_modal) && _.isFunction(_ps_modal.remove)) {
                _ps_modal.remove();
            }
        };

        scope.$close();

        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/payments-settings-modal.html', {
            scope: scope,
            animation: 'slide-in-up',
            focusFirstInput: true,
            backdropClickToClose: !no_escape,
            hardwareBackButtonClose: !no_escape
        }).then(function(modal) {
            _ps_modal = modal;
            _ps_modal.show();
            var modalEventListeners = [];
            var modalHidden = function(event, modal) {
                if(modal == _ps_modal) {
                    q[(!!_ps_modal_success) ? "resolve" : "reject"]();
                    _.forEach(modalEventListeners, function(f) {
                        _.isFunction(f) && f();
                    });
                    _ps_modal = _ps_modal_promise = null;

                }
            };
            modalEventListeners.push(scope.$on("modal.hidden", modalHidden));
        });

        _ps_modal_promise = q.promise;

        return q.promise;
    };

    factory.infosForCustomer = function(clearCache) {
        var q = $q.defer();

        var customer_id = +Customer.id;
        if(_.isNumber(customer_id) && customer_id  > 0) {
            $http({
                method: 'GET',
                url: Url.get("taxiride/mobile_view/infosforcustomer", {value_id: factory.value_id, customer_id: customer_id}),
                cache: (clearCache !== true),
                responseType:'json'
            }).success(function(data) {
                if(_.isObject(data) && !_.isUndefined(data.role)) {
                    _customers[customer_id] = data;
                    q.resolve(_customers[customer_id]);
                } else {
                    q.reject(["Unexcepted response :", data]);
                }
            }).error(function(data) {
                if(_.isArray(_.get(data, "errors")))
                    q.reject(data);
                else
                    q.reject(["Request failed", arguments]);
            });
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    factory.roleForCustomer = function() {
        var q = $q.defer();

        factory.infosForCustomer().then(function(customer_infos) {
            q.resolve(customer_infos.role);
        }, q.reject);

        return q.promise;
    };

    factory.setRoleForCustomer = function(role) {
        var q = $q.defer();

        var customer_id = +Customer.id;
        if(_.isNumber(customer_id) && customer_id > 0) {
            $http({
                method: 'GET',
                url: Url.get("taxiride/mobile_view/setroleforcustomer", {value_id: factory.value_id, customer_id: customer_id, role: role}),
                responseType:'json'
            }).success(function(data) {
                if(_.isObject(data) && _.isString(data.role)) {
                    _customers[customer_id] = data;
                    q.resolve(_customers[customer_id].role);
                } else {
                    q.reject(["Unexcepted response :", data]);
                }
            }).error(function(data) {
                if(_.isArray(_.get(data, "errors")))
                    q.reject(data);
                else
                    q.reject(["Request failed", arguments]);
            });
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    factory.saveCustomerCustomFields = function(data) {
        var q = $q.defer();

        var customer_id = +Customer.id;

        if(_.isNumber(customer_id) && customer_id > 0) {
            if(_.isObject(data)) {
                $http.postForm(
                    Url.get(
                        "taxiride/mobile_view/setinfosforcustomer",
                        {
                            value_id: factory.value_id,
                            customer_id: customer_id
                        }
                    ),
                    {custom_fields: data}
                ).success(function(data) {
                    if(_.isObject(data) && !!data.success) {
                        _customers[customer_id] = data.customer;
                        q.resolve(_customers[customer_id]);
                    } else {
                        q.reject(["Unexcepted response :", data]);
                    }
                }).error(function(data) {
                    if(_.isArray(_.get(data, "errors")))
                        q.reject(data);
                    else
                        q.reject(["Request failed", arguments]);
                });
            } else {
                q.reject(["data is not an object", null]);
            }
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    factory.removeCustomerPaymentCard = function() {
        var q = $q.defer();

        var customer_id = +Customer.id;

        if(_.isNumber(customer_id) && customer_id > 0) {
            $ionicLoading.show({
                template: $translate.instant("Removing card") + "..." + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
            });
            $http.postForm(
                Url.get(
                    "taxiride/mobile_view/removecustomerpaymentcard",
                    {
                        value_id: factory.value_id,
                        customer_id: customer_id
                    },
                    {}
                )
            ).success(function(data) {
                $ionicLoading.hide();
                if(_.isObject(data) && !!data.success) {
                    q.resolve(_customers[customer_id]);
                } else {
                    q.reject(["Unexcepted response :", data]);
                }
            }).error(function(data) {
                $ionicLoading.hide();
                if(_.isArray(_.get(data, "errors")))
                    q.reject(data);
                else
                    q.reject(["Request failed", arguments]);
            });
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    factory.savePaymentsSettingsFields = function(data) {
        var q = $q.defer();

        var customer_id = +Customer.id;

        if(_.isNumber(customer_id) && customer_id > 0) {
            if(_.isObject(data)) {
                $ionicLoading.show({
                    template: $translate.instant($translate.instant("Saving")+"...") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
                });
                $http.postForm(
                    Url.get(
                        "taxiride/mobile_view/setpaymentssettingsforcustomer",
                        {
                            value_id: factory.value_id,
                            customer_id: customer_id
                        }
                    ),
                    {payments_settings: data}
                ).success(function(data) {
                    $ionicLoading.hide();
                    if(_.isObject(data) && !!data.success) {
                        _customers[customer_id] = data.customer;
                        q.resolve(_customers[customer_id]);
                    } else {
                        q.reject(["Unexcepted response :", data]);
                    }
                }).error(function(data) {
                    $ionicLoading.hide();
                    if(_.isArray(_.get(data, "errors")))
                        q.reject(data);
                    else
                        q.reject(["Request failed", arguments]);
                });
            } else {
                q.reject(["data is not an object", null]);
            }
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    var _loaded = false;

    Object.defineProperty(factory, "loaded", {
        get: function() {
            return _loaded;
        }
    });

    var _feature_data = {};

    factory.getVehiculeTypes = function(clear_cache) {
        var q = $q.defer();

        if(_.isArray(_feature_data.vehicule_types) && clear_cache !== true) {
            q.resolve(_feature_data.vehicule_types);
        } else {
            factory.load(clear_cache).then(function(data) {
                q.resolve(data.vehicule_types);
            }, q.reject);
        }

        return q.promise;
    };

    factory.getRequestHistory = function(role) {
        var customer_id = +Customer.id;

        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getrequesthistoryforcustomer", {customer_id: customer_id, role: role}),
            cache: false,
            responseType:'json'
        });
    };

    factory.getDriversAroundLocation = function(lat, lng, type_id) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getestimation", {lat: lat, lng: lng, value_id: factory.value_id, type_id: type_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.load = function(clear_cache) {
        var q = $q.defer();

        if(_loaded && clear_cache !== true) {
            q.resolve(_feature_data);
        } else {
            if(_.isNumber(+factory.value_id) && +factory.value_id > 0) {
                $http({
                    method: 'GET',
                    url: Url.get("taxiride/mobile_view/load", {
                        'value_id': +factory.value_id,
                        "customer_id":Customer.id,
                    }),
                    cache: clear_cache !== true,
                    responseType:'json'
                }).success(function(data) {
                    if(_.isObject(data) && _.isString(data.page_title)) {
                        _feature_data = data;
                        _loaded = true;
                        q.resolve(_feature_data);
                    } else {
                        q.reject(["Unexcepted response :", data]);
                    }
                }).error(function(data) {
                    if(_.isArray(_.get(data, "errors")))
                        q.reject(data);
                    else
                        q.reject(["Request failed", arguments]);
                });
            } else {
                q.reject(["Value ID is not a number or not superior to 0 ; ", factory.value_id]);
            }
        }

        return q.promise;
    };

    factory.restoreCurrentRequest = function() {
        var q = $q.defer();

        $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getcurrentrequest", {
                value_id: +factory.value_id,
                customer_id: Customer.id
            }),
            cache: false,
            responseType:'json'
        }).success(function(data) {
            if(_.isObject(data)) {
                if(data.current_request > 0) {
                    factory.requestUpdated(data.current_request);
                    return q.resolve(data.current_request);
                }
            }
            return q.reject(null);
        }).error(function(data) {
            console.error(data);
            return q.reject(data);
        });

        return q.promise;
    };


    var _finish_popup = null;
    var MAX_RETRY = 3;
    factory.requestUpdated = function(request_id, retry_count) {
        var retrying = false;
        retry_count = +retry_count || 0;

        $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getrequest", {value_id: factory.value_id, request_id: request_id}),
            cache: false,
            responseType:'json'
        }).success(function(data) {
            if(_.isObject(data) && _.isObject(data.request)) {
                var isMyRequest = (+data.request.driver_customer_id === +Customer.id) || (+data.request.customer_id === +Customer.id);
                if(/^(searching|requesting|accepted|going)$/.test(data.request.status)) {
                    //set request as current request for passenger AND driver
                    if (isMyRequest) {
                        factory.current_request = data.request;

                        // Reset driversMaps for passenger to only show current driver
                        if(+data.request.customer_id === +Customer.id) {
                            driversMap = _.pick(driversMap, +data.request.driver_customer_id) || {};

                            $rootScope.$broadcast(factory.MAP_EVENTS.DRIVERS_MAP_UPDATED, driversMap);
                        }
                    }

                    //waiting_confirm_for_request is only for drivers waiting confirmation of request by client
                    if(waiting_confirm_for_request) {
                        //if we are the chosen one
                        if (+data.request.driver_customer_id === +Customer.id) {
                            var template = $translate.instant('Passenger accepted you as a driver.');
                        //forever alone...
                        } else {
                            var template = $translate.instant('Passenger refused you as a driver.');
                        }
                        SafePopups.show("alert",{
                            title: $translate.instant('Request'),
                            template: template
                        });
                    }
                }

                //if request has been cancelled by passenger OR driver
                if(data.request.status == "cancelled") {
                    SafePopups.show("alert",{
                        title: $translate.instant('Request'),
                        template: $translate.instant("Request has been cancelled.")
                    });
                    factory.current_request = null;
                }

                //if driver set request as finised
                if(data.request.status == "finished" && isMyRequest) {
                    if(data.request.payment_status === "unpaid") {
                        var buttons = [{
                                text: $translate.instant("OK")
                            }];
                        if(factory.role === "driver") {
                            buttons.push({
                                text: $translate.instant('Mark as paid'),
                                type: 'button-assertive',
                                onTap: function(e) {
                                    SafePopups.show("confirm",{
                                        title: $translate.instant('Confirmation'),
                                        template: $translate.instant("Do you confirm that ride is paid?")
                                    }).then(function(res){
                                        if(res) {
                                            factory.setRideAsPaid(request_id);
                                        } else {
                                            factory.requestUpdated(request_id);
                                        }
                                    });
                                }
                            });
                        } else if(factory.role === "passenger") {
                            if(factory.stripe_available && (factory.payment_methods == 'all' || factory.payment_methods == 'stripe')) {
                                buttons.push({
                                    text: $translate.instant('Pay by card'),
                                    type: 'button-assertive',
                                    onTap: function(e) {
                                        if(_.isObject(factory.payments_settings_data.card) && _.isString(factory.payments_settings_data.card.last4)) {
                                            SafePopups.show("confirm",{
                                                title: $translate.instant('Confirmation'),
                                                template: $translate.instant("Do you confirm you want to pay by card?")
                                            }).then(function(res){
                                                if(res) {
                                                    factory.pay(request_id);
                                                } else {
                                                    factory.requestUpdated(request_id);
                                                }
                                            });
                                        } else {
                                            SafePopups.show("confirm",{
                                                title: $translate.instant('No card set'),
                                                template: $translate.instant("You do not have any card configurated. Go to settings?")
                                            }).then(function(res){
                                                if(res) {
                                                    factory.showPaymentsSettingsModal();
                                                } else {
                                                    factory.requestUpdated(request_id);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                            if(factory.tco_available && (factory.payment_methods == 'all' || factory.payment_methods == '2co')) {
                                buttons.push({
                                    text: $translate.instant('Pay by card'),
                                    type: 'button-assertive',
                                    onTap: function (e) {
                                        $state.go("taxi_ride-tco", {
                                            "value_id": factory.value_id,
                                            "request_id": request_id
                                        });
                                    }
                                });
                            }
                        }
                        if(isFinite(data.request.ended_at - data.request.started_at)) {
                            var duration = data.request.ended_at - data.request.started_at;
                            var duration_h = parseInt(duration / (60 * 60));
                            duration -= duration_h * (60 * 60);

                            var duration_m = parseInt(duration / (60));
                            duration -= duration_m * (60);
                            duration_m = ((duration_m < 10) ? "0"+duration_m : duration_m);

                            var duration_s = ((duration < 10) ? "0"+duration : duration);

                            var dur = duration_h + 'h' + duration_m + 'm' + duration_s + 's';
                        } else {
                            var duration = $translate.instant('n/a');
                        }
                        var distance = $filter('number')(((data.request.final_distance/1000)* (factory.distance_unit === "km" ? 1 : 0.621371)), 2);

                        var template = '<div class="row">';
                        template += '    <div class="col col-50"><i class="icon ion-ios-time-outline"></i> '+$translate.instant('Date')+'</div>';
                        template += '    <div class="col col-50">'+data.request.created_at_formatted+'</div>';
                        template += '</div>';
                        template += '<div class="row">';
                        template += '    <div class="col col-50"><i class="icon ion-ios-stopwatch-outline"></i> '+$translate.instant('Duration')+'</div>';
                        template += '    <div class="col col-50">'+dur+'</div>';
                        template += '</div>';
                        template += '<div class="row">';
                        template += '    <div class="col col-50"><i class="icon ion-ios-navigate-outline"></i> '+$translate.instant('Distance')+'</div>';
                        template += '    <div class="col col-50">'+distance+' '+factory.distance_unit+'</div>';
                        template += '</div>';
                        template += '<div class="row">';
                        template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> '+$translate.instant('Driver base fare')+'</div>';
                        template += '    <div class="col col-50">'+data.request.driver_base_fare+'</div>';
                        template += '</div>';

                        if(_.isString(data.request.driver_time_fare) && data.request.driver_time_fare.trim().length > 0)
                        {
                            template += '<div class="row">';
                            template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> '+$translate.instant('Driver time fare')+'</div>';
                            template += '    <div class="col col-50">'+data.request.driver_time_fare+'</div>';
                            template += '</div>';
                        } else {
                            template += '<div class="row">';
                            template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> '+$translate.instant('Driver distance fare')+'</div>';
                            template += '    <div class="col col-50">'+data.request.driver_distance_fare+'</div>';
                            template += '</div>';
                        }

                        template += '<div class="row">';
                        template += '    <strong class="col col-50"><i class="icon ion-ios-calculator-outline"></i> '+$translate.instant('Total price')+'</strong>';
                        template += '    <strong class="col col-50">'+data.request.price+'</strong>';
                        template += '</div>';

                        _finish_popup = SafePopups.show("show",{
                            title: $translate.instant('Ride is finished'),
                            cssClass: "taxiride",
                            template: template,
                            buttons: buttons
                        });
                        factory.current_request = data.request;
                    } else if (data.request.payment_status === "paid"){
                        if(_.isObject(_finish_popup) && _.isFunction(_finish_popup.close)) {
                            _finish_popup.close();
                            _finish_popup = null;
                        }

                        SafePopups.show("show",{
                            title: $translate.instant('Ride finished'),
                            template: $translate.instant("Ride has been paid by client"),
                            buttons: [{
                                text: $translate.instant("OK")
                            }]
                        });
                        factory.current_request = null;
                    }
                }
            }
        }).error(function() {
            if(retry_count >= MAX_RETRY) {
                SafePopups.show("alert",{
                    title: $translate.instant('Error'),
                    template: $translate.instant("An error occured. Restart app or manage request from history panel.")
                });
                factory.current_request = null;
            } else {
                retrying = true;
                factory.requestUpdated(request_id, retry_count+1);
            }
        }).finally(function() {
            if(retrying)
                return;

            waiting_confirm_for_request = false;
            $ionicLoading.hide();

            $rootScope.$broadcast(factory.REQUEST_UPDATED);
        });
    }

    _.forEach([
        "page_title", "distance_unit", "payment_methods",
        "search_radius", "search_timeout", "stripe_key",
        "vehicules_types", "SocketIO_Port", "currency_symbol", "countries_list", "states_list", "stripe_available", "tco_available", "allow_manual_prices", "prices_disclamer"
    ], function(key) {
        Object.defineProperty(factory, key, {
            get: function() {
                return _.get(_feature_data, key);
            }
        });
    });

    var _socket = null;
    var _socket_listeners = {};

    function addSocketListener(name, func) {
        if(!_.isArray(_socket_listeners[name]))
            _socket_listeners[name] = [];

        if(!_.includes(_socket_listeners[name], func)) {
            _socket_listeners[name].push(func);
            if(_.isObject(_socket))
                _socket.on(name, func);
        }
    }

    function removeSocketListener(name, func) {
        if(_.isObject(_socket))
            _socket.removeListener(name, func);

        if(_.isArray(_socket_listeners[name])) {
            var index = _socket_listeners[name].indexOf(func);
            if(index >= 0) {
                _socket_listeners[name].splice(index, 1);
            }
            if(_socket_listeners[name].length < 1) {
                delete _socket_listeners[name];
            }
        }
    }

    function bindSocketListeners() {
        _.forEach(_socket_listeners, function(listeners, name) {
            _.forEach(listeners, function(func) {
                _socket.on(name, func);
            });
        });
    }

    var _$socket_connected = $q.defer();

    var $socket = function() {
        if(angular.isObject(_socket) && _socket.disconnected === true && !(_socket.reconnecting || _socket.connecting)) {
            try {
                _socket.disconnect();
            } catch (e) {
                console.error(e);
            }
            _socket = null;
            if(_$socket_connected === null) {
                _$socket_connected = $q.defer();
            }
        }

        if(_socket === null) {
            _socket = new io.connect(DOMAIN+":"+factory.SocketIO_Port+"/taxiride", {
                'reconnection': true,
                'reconnectionDelay': 1000,
                'reconnectionDelayMax' : 5000,
                'reconnectionAttempts': 30
            });

            var original_emit = _socket.emit;
            _socket.emit = function(message, data, callback) {
                if(_.isString(message) && _.isObject(data)) {
                    original_emit.call(_socket, "***", _.merge({socket_event_name: message}, data));
                    return original_emit.call(_socket, message, data, callback);
                } else {
                    return original_emit.apply(_socket, arguments);
                }
            };

            bindSocketListeners();

        }

        if(!_socket.connected) {
            if(_$socket_connected === null) {
                _$socket_connected = $q.defer();
            }

            _socket.on("connected", function () {
                console.log("socket connected");
                if(_$socket_connected) {
                    _$socket_connected.resolve(_socket);
                    _$socket_connected = null;
                }
            });
        } else {
            if(_$socket_connected) {
                _$socket_connected.resolve(_socket);
                _$socket_connected = null;
            }
            return $q.resolve(_socket);
        }

        return _$socket_connected.promise;
    };

    var payload = function(payload) {
        if(!angular.isObject(payload))
            payload = {};

        return angular.extend({}, {
            sessionID: $window.localStorage.getItem("sb-auth-token"),
            appID: Application.app_id,
            valueID: factory.value_id,
            search_radius: factory.search_radius,
            search_timeout: factory.search_timeout,
            distance_unit: factory.distance_unit
        }, payload);
    };

    function goOnline(role) {
        return function() {
            return $socket().then(function(io) {
                io.emit(role+".online", payload(_.pick((role === "passenger" ? lastPassengerPos : role === "driver" ? lastDriverPosition : {}), ["latitude", "longitude"])));
                return $q.resolve(io);
            });
        };
    }

    function sendLocalNotification() {
        var params = {
            id: TAXIRIDE_LOCAL_NOTIFICATION_ID, // why not
            data: {
                taxiride: true
            }
        };

        if(ionic.Platform.isIOS()) {
            params.title = $translate.instant("New ride request incoming");
        } else {
            params.title = factory.page_title;
            params.text = $translate.instant("New ride request incoming");
        }

        if(ionic.Platform.isAndroid())
            params.icon = "res://icon.png";

        params.data = { taxiride: true };

        // Send Local Notification
        $cordovaLocalNotification.schedule(params);
    }

    var waiting_confirm_for_request = false;
    function rideRequest(data) {
        if(waiting_confirm_for_request || _.isObject(factory.current_request))
            return;

        var timestamp = (+new Date());

        var driver = {
            base_fare: factory.payments_settings_data.base_fare,
            distance_fare: factory.payments_settings_data.distance_fare,
            time_fare: factory.payments_settings_data.time_fare,
            position: {
                lat: lastDriverPosition.latitude,
                lng: lastDriverPosition.longitude
            }
        };

        if(factory.distance_unit !== "km")
            driver.distance_fare *= 0.621371; // convert it to price by km

        var showRideRequest = function(request) {

            try {
                sendLocalNotification();
            } catch(e) {
                console.error("While notifying rideRequest");
                console.error(e);
            }

            var payment_label = $translate.instant("Credit Card");
            switch(request.payment_method) {
                case "stripe":
                    payment_label = $translate.instant("Credit Card");
                    break;
                case "2co":
                    payment_label = $translate.instant("Credit Card (via 2Checkout)");
                    break;
                case "cash":
                    payment_label = $translate.instant("Cash");
                    break;
            }

            var template = '<div class="list">';
            template += '<div class="item item-divider">' +
                $translate.instant("Drop off address:") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.dropoff_address +
                '</div>';
                template += '<div class="item item-divider">' +
                $translate.instant("Total charge") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                $filter('number')(request.price,2) +
                '</div>'+
                '<div class="item item-divider">' +
                $translate.instant("Payment method") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                payment_label +
                '</div>' +
                '<div class="item item-divider">' +
                $translate.instant("Full ride") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.to_dropoff.eta.text + "<br />" +
                    request.to_dropoff.distance.text +
                '</div>'+
                '<div class="item item-divider">' +
                $translate.instant("Ride to passenger") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.to_pickup.eta.text + "<br/>" +
                request.to_pickup.distance.text +
                '</div>'+
                '   </div>';

            var dialog_data = {
                title: $translate.instant("Request") + ' #' + request.taxiride_request_id,
                cssClass: "taxiride",
                template: template,
                okText: $translate.instant('Accept'),
                cancelText: $translate.instant('Refuse')
            };

            var time_to_show = function() {
                return Math.max((((+factory.search_timeout || 60)*1000) - ((+new Date())-timestamp)), 0);
            };

            if(time_to_show() > 5000) {
                var popup = SafePopups.show("confirm", dialog_data);
                popup.then(function(res) {
                    cancelTaxiRideNotification();
                    if(res) {
                        factory.driver.acceptRequest(request);
                        $ionicLoading.show({
                            template: $translate.instant("Waiting for client confirmation...") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
                        });
                        $timeout(function() {
                            $ionicLoading.hide();
                        }, time_to_show()+(factory.search_timeout*1000));
                    }
                });

                $timeout(function() {
                    cancelTaxiRideNotification();
                    if(_.isObject(popup) && _.isFunction(popup.close))
                        popup.close();
                }, time_to_show());


                $timeout(function() {
                    cancelTaxiRideNotification();
                    $ionicLoading.hide();

                    if(waiting_confirm_for_request) {
                        SafePopups.show("alert",{
                            title: $translate.instant('Request'),
                            template: $translate.instant("Passenger's request has been cancelled")
                        });
                        waiting_confirm_for_request = false;
                    }
                }, time_to_show()+(factory.search_timeout*1000));

            } else {
                waiting_confirm_for_request = false;
            }

        };


        factory.calculateRoute(
            {lat: data.pickup_lat, lng: data.pickup_long},
            {lat: data.dropoff_lat, lng: data.dropoff_long},
            driver
        ).then(function(total_route) {
            var price = +driver.base_fare || 0;
            var duration = parseInt(_.get(total_route, "routes[0].legs[1].duration.value"));
            var distance = parseInt(_.get(total_route, "routes[0].legs[1].distance.value"));

            if(+driver.time_fare > 0)
                price += Math.floor(duration/60) * driver.time_fare;
            else if(+driver.distance_fare > 0)
                price += (distance / 1000) * driver.distance_fare;

            factory.calculateRoute(
                driver.position,
                {lat: data.pickup_lat, lng: data.pickup_long}
            ).then(function(route_to_pickup) {
                showRideRequest(_.merge(data, {
                    price: price,
                    to_pickup: {
                        eta: _.get(route_to_pickup, "routes[0].legs[0].duration"),
                        distance: _.get(route_to_pickup, "routes[0].legs[0].distance")
                    },
                    to_dropoff: {
                        eta: _.get(total_route, "routes[0].legs[1].duration"),
                        distance: _.get(total_route, "routes[0].legs[1].distance")
                    }
                }));
            }, function() {
                showRideRequest(_.merge(data, {
                    price: price,
                    to_pickup: {
                        eta: {text: "N/A", value: -1},
                        distance: {text: "N/A", value: -1}
                    },
                    to_dropoff: {
                        eta: _.get(total_route, "routes[0].legs[1].duration"),
                        distance: _.get(total_route, "routes[0].legs[1].distance")
                    }
                }));
            });
        }, function() {
            showRideRequest(_.merge(data, {
                price: "N/A",
                to_pickup: {
                    eta: {text: "N/A", value: -1},
                    distance: {text: "N/A", value: -1}
                },
                to_dropoff: {
                    eta: {text: "N/A", value: -1},
                    distance: {text: "N/A", value: -1}
                }
            }));
        });

    }

    var driver_goOnline = goOnline("driver");
    var passenger_goOnline = goOnline("passenger");

    factory.driver = {};

    factory.driver.goOnline = function() {
        addSocketListener("connected", driver_goOnline);
        addSocketListener("rideRequest", rideRequest);
        addSocketListener("requestUpdated", factory.requestUpdated);
        driver_goOnline();
        positionBuffer.startTimer();
    };

    var lastDriverPosition = null;
    factory.driver.updatePosition = function (timestamp, position) {
        if(_.isObject(lastDriverPosition) && _.isObject(position) &&
           (+lastDriverPosition.latitude).toFixed(5) === (+position.latitude).toFixed(5) &&
           (+lastDriverPosition.longitude).toFixed(5) === (+position.longitude).toFixed(5)
          )
            return;

        lastDriverPosition = position;

        positionBuffer.addPosition("driver", _.get(factory, "current_request.id", 0), {
            gps_timestamp: timestamp,
            latitude: position.latitude,
            longitude: position.longitude
        });
    };

    factory.driver.acceptRequest = function(request) {
        driver_goOnline().then(function(io) {
            io.emit("driver.acceptRequest", payload({
                request: request
            }));
        });
    };


    factory.driver.goOffline = function() {
        $socket().then(function(io){
            io.emit("driver.offline", payload());
            io.disconnect();
        });
        removeSocketListener("connected", driver_goOnline);
        positionBuffer.stopTimer();
    };

    factory.passenger = {};

    var driversMap = {};
    Object.defineProperty(factory.passenger, "drivers", {
        get: function() {
            return _.values(driversMap);
        }
    });

    function updateDrivers(driver) {
        if(_.isArray(driver)) {
            _.forEach(driver, updateDrivers);
        } else if(_.isObject(driver) && _.isNumber(+driver.id)) {
            if(_.isNull(factory.current_request) || +driver.id == +factory.current_request.driver_customer_id ) {
                if(driver.removed === true) {
                    delete driversMap[+driver.id];
                    $rootScope.$broadcast(factory.MAP_EVENTS.DRIVER_DISAPPEARED, driver);
                } else {
                    var event = (_.isObject(driversMap[+driver.id])) ? factory.MAP_EVENTS.DRIVER_UPDATED : factory.MAP_EVENTS.DRIVER_APPEARED;
                    driversMap[+driver.id] = driver;

                    $rootScope.$broadcast(event, driver);
                }
            }
        }
    }


    var lastPassengerPos = null; // used when reconnecting
    function resendLastPos() {
        if(lastPassengerPos !== null) {
            factory.passenger.updatePosition((+new Date()), lastPassengerPos);
        }
    }

    function driverAccepted(data) {
        factory.calculateRoute(
            {lat: data.request.pickup_lat, lng: data.request.pickup_long},
            {lat: data.request.dropoff_lat, lng: data.request.dropoff_long},
            data.driver
        ).then(function(total_route) {
            factory.calculateRoute(
                data.driver.position,
                {lat: data.request.pickup_lat, lng: data.request.pickup_long}
            ).then(function(route_to_pickup) {
                var price = +data.driver.base_fare || 0;
                var duration = parseInt(_.get(total_route, "routes[0].legs[1].duration.value"));
                var distance = parseInt(_.get(total_route, "routes[0].legs[1].distance.value"));

                if(+data.driver.time_fare > 0) {
                    price += Math.floor(duration/60) * data.driver.time_fare;
                } else {
                    price += (distance / 1000) * data.driver.distance_fare;
                }

                $rootScope.$broadcast(
                    factory.DRIVER_ACCEPTED_REQUEST,
                    _.merge(
                        data.driver,
                        {
                            eta: _.get(route_to_pickup, "routes[0].legs[0].duration"),
                            price: $filter('number')(price,2)
                        }
                    ),
                    data.request
                );
            });
        });
    }

    function resetDriversMap() {
        driversMap = {};
        $rootScope.$broadcast(factory.MAP_EVENTS.DRIVERS_MAP_UPDATED, {});
    }

    factory.passenger.goOnline = function(position) {
        addSocketListener("connected", passenger_goOnline);
        addSocketListener("driversUpdate", updateDrivers);
        addSocketListener("driverAccepted", driverAccepted);
        addSocketListener("requestUpdated", factory.requestUpdated);
        addSocketListener("disconnect", resetDriversMap);
        addSocketListener("reconnecting", resetDriversMap);
        addSocketListener("reconnect_failed", resetDriversMap);
        addSocketListener("connected", resendLastPos);
        positionBuffer.startTimer();
        passenger_goOnline();
    };

    factory.passenger.updatePosition = function(timestamp, position) {
        if(_.isObject(lastPassengerPos) && _.isObject(position) &&
           (+lastPassengerPos.latitude).toFixed(5) === (+position.latitude).toFixed(5) &&
           (+lastPassengerPos.longitude).toFixed(5) === (+position.longitude).toFixed(5)
          )
            return;

        lastPassengerPos = position;
        positionBuffer.addPosition("passenger", _.get(factory, "current_request.id", 0), {
            gps_timestamp: timestamp,
            latitude: position.latitude,
            longitude: position.longitude
        });
    };

    factory.passenger.goOffline = function() {
        lastPassengerPos = null;
        $socket().then(function(io){
            io.emit("passenger.offline");
            io.disconnect();
        });
        removeSocketListener("driversUpdate", updateDrivers);
        removeSocketListener("disconnect", resetDriversMap);
        removeSocketListener("reconnecting", resetDriversMap);
        removeSocketListener("reconnect_failed", resetDriversMap);
        removeSocketListener("connected", passenger_goOnline);
        removeSocketListener("connected", resendLastPos);
        positionBuffer.stopTimer();
    };

    var current_make_request_promise = null;
    factory.passenger.makeRequest = function(request, vehicule_type_id) {
        if(_.isObject(current_make_request_promise))
            return current_make_request_promise;

        var q = $q.defer();
        current_make_request_promise = q.promise;

        var error = function(data) {
            q.reject(data);
        };

        $http.postForm(
            Url.get("taxiride/mobile_view/makerequest", {
                value_id: factory.value_id, customer_id: +Customer.id
            }),
            {request: request}
        ).success(function(data) {
            if(_.isObject(data) && _.isObject(data.request) && !_.isUndefined(data.request.taxiride_request_id)) {
                passenger_goOnline().then(function(io) {
                    io.emit("passenger.sendRequest", payload({
                        request: data.request,
                        vehicule_type_id: vehicule_type_id
                    }));
                });
                q.resolve(data);
            } else {
                error(data);
            }
        }).error(error).finally(function() { current_make_request_promise = null; });

        return current_make_request_promise;
    };

    factory.passenger.acceptRequest = function(request, driver) {
        passenger_goOnline().then(function(io) {
            io.emit("passenger.acceptRequest", payload({
                driver: driver,
                request: request
            }));
        });
    };

    factory.updateStatus = function(request, status, final_price) {
        goOnline(factory.role)().then(function(io) {
            var hideLoading = $timeout(function() {
                $ionicLoading.hide();
            }, 15000);

            var unregisterListener = $rootScope.$on(factory.REQUEST_UPDATED, function() {
                // If we received request updated it's okay we can cancel the auto hide, loading has already been hide
                $timeout.cancel(hideLoading);
                unregisterListener();
            });

            $ionicLoading.show("<ion-spinner class=\"spinner-custom\"></ion-spinner>");

            io.emit("taxiride.updateRequest", payload({
                request: request,
                status: status,
                final_price: final_price
            }));
        });
    };

    factory.driver.setRidePrice = function(request_id) {
        var q = $q.defer();

        if(factory.allow_manual_prices) {
            var scope = $rootScope.$new();
            scope.final_popup = {final_price: null};

            SafePopups.show(
                "show", // Cannot use prompt because OF REASONS. IONIC REASONS
                {
                    title: $translate.instant("Please enter final price :"),
                    template: "<input autofocus type=\"number\" ng-model=\"final_popup.final_price\">",
                    scope: scope,
                    buttons: [{
                        text: $translate.instant("Close"),
                        onTap: function() {
                            q.reject();
                        }
                    }, {
                        text: $translate.instant("Set price"),
                        type: 'button-balanced',
                        onTap: function() {
                            var final_price =  parseFloat(scope.final_popup.final_price);
                            if(isNaN(final_price) || final_price < 0) {
                                SafePopups.show("alert", {
                                    title: $translate.instant("Incorrect price"),
                                    template: ($translate.instant("Final price can't be negative and format should use only dot and numbers. e.g. : 1234.56"))
                                }).then(function() { factory.driver.setRidePrice(request_id); });
                            } else {
                                $http.postForm(
                                    Url.get(
                                        "taxiride/mobile_view/setrequestfinalprice",
                                        {
                                            value_id: factory.value_id,
                                            request_id: request_id
                                        }
                                    ),
                                    {
                                        final_price: final_price
                                    }
                                ).success(function(data) {
                                    q.resolve();
                                }).error(q.reject);
                            }
                        }
                    }]
                }
            );
        } else {
            q.reject();
        }

        return q.promise;
    };

    factory.broadcastRequest = function(request_id) {
        goOnline(factory.role)().then(function(io) {
            io.emit("taxiride.broadcastRequest", request_id);
        });
    };


    factory.calculateRoute = function(from, to, driver, params) {
        params = _.merge({
            mode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: factory.distance_unit === "km" ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL,
            request: {}
        }, _.isObject(params) ? params : {});

        var start = {latitude: from.lat, longitude: from.lng};

        if(_.isObject(driver) && _.isObject(driver.position) && _.isNumber(+driver.position.lat+(+driver.position.lng))) {
            params.request.waypoints = [{location: new google.maps.LatLng(start.latitude, start.longitude), stopover: true}];
            start = {latitude: +driver.position.lat, longitude: +driver.position.lng};
        }

        var dest = {latitude: to.lat, longitude: to.lng};


        return GoogleMaps.calculateRoute(start, dest, params, true);
    };

    factory.tco = {};

    factory.tco.getConfig = function(request_id) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/tcoconfig", {value_id: factory.value_id, "request_id": request_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.tco.processTransaction = function(token, total, request_id) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/tcoprocess", {value_id: factory.value_id, token: token, total: total, request_id: request_id}),
            cache: false,
            responseType:'json'
        });
    };

    return factory;
});
