/** Utility methods */
function removeClassById(id, klass) {
    document.getElementById(id).classList.remove(klass);
}

function addClassById(id, klass) {
    document.getElementById(id).classList.add(klass);
}

function removeClassByClass(klass, css_klass) {
    [].forEach.call(document.getElementsByClassName(klass), function(el) { el.classList.remove(css_klass) });
}

function addClassByClass(klass, css_klass) {
    [].forEach.call(document.getElementsByClassName(klass), function(el) { el.classList.add(css_klass) });
}

/** Utility methods */


App.config(function($stateProvider, $urlRouterProvider, HomepageLayoutProvider) {

        $stateProvider.state('appointment-view', {
            url: BASE_PATH + "/appointment/mobile_view/index/value_id/:value_id",
            controller: 'AppointmentController',
            templateUrl: "modules/appointment/templates/l1/view.html"
        }).state('appointment-booked', {
            url: BASE_PATH + "/appointment/mobile_view/index/value_id/:value_id",
            controller: 'AppointmentBookedController',
            templateUrl: "modules/appointment/templates/l1/booked.html"
        }).state('appointment-notification', {
            url: BASE_PATH + "/appointment/mobile_view/index/value_id/:value_id",
            controller: 'NotificationController',
            templateUrl: "modules/appointment/templates/l1/notification.html"
        }).state('appointment-location', {
            url: BASE_PATH + "/appointment/mobile_view/index/value_id/:value_id",
            controller: 'LocationController',
            templateUrl: "modules/appointment/templates/l1/location.html",
        });
    }).controller('AppointmentController', function(Customer, $controller, AUTH_EVENTS, $ionicModal, $scope, $stateParams, $state, Appointment) {

        $scope.value_id = Appointment.value_id = $stateParams.value_id;
        $scope.is_logged_in = Customer.isLoggedIn();
        $scope.is_loading = true;

        Appointment.getSettings().success(function(data) {
            Appointment.settings = data.settings;
            $scope.settings = Appointment.settings;
        }).finally(function() {
            $scope.is_loading = false;
        });

        $scope.$on(AUTH_EVENTS.loginSuccess, function() {
            $scope.is_logged_in = true;
            $scope.gotoAppointment();
        });

        $scope.login = function() {
            $ionicModal.fromTemplateUrl('templates/customer/account/l1/login.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                Customer.modal = modal;
                Customer.modal.show();
            });
        };

        $scope.gotoAppointment = function() {
            if (!Customer.isLoggedIn()) {
                $scope.login();
                return;
            } else {
                $state.go("appointment-booked", { value_id: $scope.value_id });
            }
        };
        $scope.gotoBookAppointment = function() {
            $state.go("appointment-location", { value_id: $scope.value_id });
        };
    })
    .controller('AppointmentBookedController', function($controller, $scope, $ionicModal, $stateParams, $state, $translate, Appointment, Customer) {
        $scope.value_id = Appointment.value_id = $stateParams.value_id;
        $scope.is_logged_in = Customer.isLoggedIn();
        $scope.is_loading = true;
        $scope.settings = Appointment.settings;

        $scope.page_title = $translate.instant("Appointments");

        $scope.goBack = function() {
            $state.go("appointment-view", { value_id: $scope.value_id });
        };

        $scope.notification = function() {
            $state.go("appointment-notification", { value_id: $scope.value_id });
        };

        $scope.login = function() {
            $ionicModal.fromTemplateUrl('templates/customer/account/l1/login.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                Customer.modal = modal;
                Customer.modal.show();
            });
            $state.go("appointment-view", { value_id: $scope.value_id });
        };

        $scope.loadContent = function(mode) {
            if (!$scope.is_logged_in) {
                $state.go("appointment-view", { value_id: $scope.value_id });
            } else {
                Customer.find().success(function(data) {
                    Appointment.displayappointmentlist(data.id).success(function(data) {
                        if (data.status == "success") {
                            $scope.appointmentlist = data.data;
                        } else {
                            $scope.booking_zero = data.message;
                        }
                    }).finally(function() {
                        $scope.is_loading = false;
                    });

                });
            }
        };

        $scope.loadContent();
    }).controller('NotificationController', function(Customer, $controller, AUTH_EVENTS, $ionicModal, $scope, $stateParams, $state, Appointment) {
        $scope.value_id = Appointment.value_id = $stateParams.value_id;
        $scope.settings = Appointment.settings;
        Customer.find().success(function(data) {
            Appointment.getnotificationstatus(data.id).success(function(data) {
                if (data.status == false) {
                    $scope.isActive = 2;
                } else {
                    $scope.isActive = data.notification_time;
                }
            }).finally(function() {
                $scope.is_loading = false;
            });
        });


        $scope.value_id = Appointment.value_id = $stateParams.value_id;

        $scope.notify_time = function(index) {
            $scope.isActive = index;
            Customer.find().success(function(data) {
                Appointment.appointmentnotify(data.id, index).success(function(data) {

                }).finally(function() {
                    $scope.is_loading = false;
                });
            });
        };
    })

.controller('LocationController', function($controller, $ionicScrollDelegate, $ionicTabsDelegate, Authorization, Customer, $ionicModal, AUTH_EVENTS, $rootScope, $scope, $stateParams, $translate, $compile, $state, Appointment, $timeout) {

    $scope.location_tab = true;
    $scope.category_tab = true;
    $scope.service_tab = true;
    $scope.provider_tab = true;
    $scope.date_tab = true;
    $scope.info_tab = true;
    $scope.confirm_tab = true;
    $scope.is_loading = true;
    $scope.value_id = Appointment.value_id = $stateParams.value_id;
    $scope.is_logged_in = Customer.isLoggedIn();

    $scope.location_title = $translate.instant("Location");
    $scope.category_title = $translate.instant("Category");
    $scope.service_title = $translate.instant("Service");
    $scope.provider_title = $translate.instant("Provider");
    $scope.date_title = $translate.instant("Date");
    $scope.info_title = $translate.instant("Info");
    $scope.confirm_title = $translate.instant("Confirm");

    $scope.settings = Appointment.settings;

    $scope.login = function() {
        $ionicModal.fromTemplateUrl('templates/customer/account/l1/login.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            Customer.modal = modal;
            Customer.modal.show();
        });
    };

    //Code to show available Locations
    Appointment.getLocations().success(function(data) {
        $scope.location = false;
        $scope.page_title = data.page_title;
        if (data.locations) {
            if (data.total_records == 1) {
                $scope.location_tab = false;
                console.log($scope.location_tab);
                $scope.gotoloc(data.locations[0].location_id);
            }
            $scope.locations = data.locations;
            $scope.location = true;
            $scope.goBack = function() {
                $state.go("appointment-view", { value_id: $scope.value_id });
            }
        }
    }).finally(function() {
        $scope.is_loading = false;
    });

    $scope.showLocations = true;
    $scope.showCategories = false;
    $scope.showServices = false;
    $scope.showProviders = false;
    $scope.showCalendar = false;
    $scope.showTime = false;
    $scope.showInformation = false;
    $scope.showConfirmInformation = false;
    $scope.thankyoupage = false;

    $scope.gotoloc = function(location_id) {
        $ionicTabsDelegate.select(1);
        $timeout(function() {
            $ionicScrollDelegate.scrollTop();
        }, 100);

        $scope.is_loading = true;
        $scope.showLocations = false;
        $scope.showCategories = true;
        $scope.location_id = location_id;

        //Code to show available Categories
        Appointment.getcategories($scope.location_id).success(function(data) {
            $scope.is_loading = true;
            $scope.category = false;
            $scope.page_title = data.page_title;
            $scope.categories = data.categories;
            $scope.category = true;

            if (data.total_records == 0) {
                $scope.no_category = true;
                $scope.category_present = false;
                $scope.blank_category = "Category Not Present";
            } else {
                if (data.total_records == 1) {
                    $scope.category_tab = false;
                    $scope.gotoCategory(data.categories[0].category_id);
                }
                $scope.no_category = false;
                $scope.category_present = true;
                if (data.categories) {
                    $scope.locations = data.locations;
                    $scope.location = true;
                }
            }
            $scope.goBack = function() {
                $state.go("appointment-view", { value_id: $scope.value_id });
            }
        }).finally(function() {
            $scope.is_loading = false;
        });

        $scope.loadlocation = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showCategories = false;
            $scope.showLocations = true;

            Appointment.getLocations().success(function(data) {
                $scope.locations = data.locations;
            }).finally(function() {
                $scope.is_loading = false;
            });
        };

    };

    $scope.gotoCategory = function(category_id) {
        $ionicTabsDelegate.select(2);
        $timeout(function() {
            $ionicScrollDelegate.scrollTop();
        }, 100);

        $scope.is_loading = true;
        $scope.showCategories = false;
        $scope.showServices = true;
        $scope.category_id = category_id;

        //Code to show available Services
        Appointment.getservices($scope.location_id, $scope.category_id).success(function(data) {
            $scope.page_title = data.page_title;
            if (data.total_records == 0) {
                $scope.no_service = true;
                $scope.service_present = false;
                $scope.blank_service = "Service Not Present";
            } else {
                $scope.no_service = false;
                $scope.service_present = true;
                $scope.service = false;
                $scope.services = data.services;
                $scope.service = true;
            }
            $scope.goBack = function() {
                $state.go("appointment-view", { value_id: $scope.value_id });
            }
        }).finally(function() {
            $scope.is_loading = false;
        });

        $scope.loadlocation = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showLocations = true;

            Appointment.getLocations().success(function(data) {
                $scope.locations = data.locations;
            }).finally(function() {
                $scope.is_loading = false;
            });
        };

        $scope.loadcategory = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = true;
            $scope.showServices = false;
        };
    };

    $scope.gotoService = function(service_id, name) {
        $ionicTabsDelegate.select(3);
        $timeout(function() {
            $ionicScrollDelegate.scrollTop();
        }, 100);

        $scope.is_loading = true;
        $scope.showServices = false;
        $scope.showProviders = true;
        $scope.service_id = service_id;
        $scope.service_name = name;


        //Code to show available Providers
        Appointment.getproviders($scope.location_id, $scope.category_id, $scope.service_id).success(function(data) {
            $scope.provider = false;
            $scope.page_title = data.page_title;
            if (data.provider) {
                $scope.providers = data.providers;
                $scope.base_url = data.base_url;
            }

            $scope.goBack = function() {
                $state.go("appointment-view", { value_id: $scope.value_id });
            };

        }).finally(function() {
            $scope.is_loading = false;
        });

        $scope.custom = true;
        $scope.prv = 0;
        $scope.show_pro_info = function(provider_id) {
            $scope.prv = ($scope.prv == provider_id) ?  0 : provider_id;            
        };

        $scope.loadlocation = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showProviders = false;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showLocations = true;

            Appointment.getLocations().success(function(data) {
                $scope.locations = data.locations;
            }).finally(function() {
                $scope.is_loading = false;
            });
        };

        $scope.loadcategory = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showProviders = false;
            $scope.showLocations = false;
            $scope.showCategories = true;
            $scope.showServices = false;
        };

        $scope.loadservice = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showProviders = false;
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = true;
        };
    };

    $scope.gotoProvider = function(provider_id, name) {
        $ionicTabsDelegate.select(4);
        $timeout(function() {
            $ionicScrollDelegate.scrollTop();
        }, 100);
        
        $scope.page_title = $translate.instant("Appointments");
        $scope.showProviders = false;
        $scope.showCalendar = true;
        $scope.provider_id = provider_id;
        $scope.provider_name = name;

        $scope.loadlocation = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = true;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = false;

            Appointment.getLocations().success(function(data) {
                $scope.locations = data.locations;
            }).finally(function() {
                $scope.is_loading = false;
            });
        };

        $scope.loadcategory = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = true;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = false;
        };

        $scope.loadservice = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = true;
            $scope.showProviders = false;
            $scope.showCalendar = false;
            $scope.showTime = false;
        };

        $scope.loadprovider = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = true;
            $scope.showCalendar = false;
            $scope.showTime = false;

        };
    };

    var d = new Date();
    var present_month = d.getMonth();
    var present_date = d.getDate();

    $scope.loadContent = function(mode) {
        var month = [
            $translate.instant("January"),
            $translate.instant("February"),
            $translate.instant("March"),
            $translate.instant("April"),
            $translate.instant("May"),
            $translate.instant("June"),
            $translate.instant("July"),
            $translate.instant("August"),
            $translate.instant("September"),
            $translate.instant("October"),
            $translate.instant("November"),
            $translate.instant("December")
        ];
        var days = [
            $translate.instant("Sunday"),
            $translate.instant("Monday"),
            $translate.instant("Tuesday"),
            $translate.instant("Wednesday"),
            $translate.instant("Thursday"),
            $translate.instant("Friday"),
            $translate.instant("Saturday")
        ];
        var days_abr = [
            $translate.instant("Sun"),
            $translate.instant("Mon"),
            $translate.instant("Tue"),
            $translate.instant("Wed"),
            $translate.instant("Thu"),
            $translate.instant("Fri"),
            $translate.instant("Sat")
        ];

        Number.prototype.pad = function(num) {
            var str = '';
            for (var i = 0; i < (num - this.toString().length); i++)
                str += '0';
            return str += this.toString();
        };

        function calendari(widget, data) {
            var original = widget.getElementsByClassName('active')[0];

            if (typeof original === 'undefined') {
                original = document.createElement('table');
                original.setAttribute('data-actual',
                    data.getFullYear() + '/' +
                    data.getMonth() + '/' +
                    data.getDate());
                widget.appendChild(original);
            }
            var diff = data - new Date(original.getAttribute('data-actual'));
            diff = new Date(diff).getMonth();
            var e = document.createElement('table');

            e.addclass = 'table table-bordered table-fixed monthview-datetable';
            e.className = diff === 0 ? 'hide-left' : 'hidden-right';
            e.innerHTML = '';

            widget.appendChild(e);
            e.setAttribute('data-actual',
                data.getDate().pad(2) + '/' +
                (data.getMonth()).pad(2) + '/' +
                data.getFullYear());

            var row = document.createElement('tr');
            var title = document.createElement('th');

            title.setAttribute('colspan', 7);

            var boto_prev = document.createElement('button');
            boto_prev.className = 'boto-prev';
            boto_prev.innerHTML = '&#9666;';

            var boto_next = document.createElement('button');
            boto_next.className = 'boto-next';
            boto_next.innerHTML = '&#9656;';

            title.appendChild(boto_prev);
            title.appendChild(document.createElement('span')).innerHTML =
                month[data.getMonth()] + '<span class="any">' + data.getFullYear() + '</span>';

            title.appendChild(boto_next);

            boto_prev.onclick = function() {
                data.setMonth(data.getMonth() - 1);
                calendari(widget, data);
            };

            boto_next.onclick = function() {
                data.setMonth(data.getMonth() + 1);
                calendari(widget, data);
            };

            row.appendChild(title);
            e.appendChild(row);

            row = document.createElement('tr');

            for (var i = 1; i < 7; i++) {
                row.innerHTML += '<th><small>' + days_abr[i] + '</small></th>';
            }

            row.innerHTML += '<th><small>' + days_abr[0] + '</small></th>';
            e.appendChild(row);

            var cal_mes =
                new Date(data.getFullYear(), data.getMonth(), -1).getDay();

            var actual = new Date(data.getFullYear(),
                data.getMonth(), -cal_mes);

            for (var s = 0; s < 6; s++) {
                var row = document.createElement('tr');
                for (var d = 1; d < 8; d++) {
                    var cell = document.createElement('td');
                    var span = document.createElement('small');

                    cell.appendChild(span);
                    cell.setAttribute('id',
                        actual.getDate().pad(2) + '/' +
                        (actual.getMonth() + 1).pad(2) + '/' +
                        actual.getFullYear()
                    );
                    cell.setAttribute('class',
                        actual.getDate().pad(2) + '-' +
                        (actual.getMonth() + 1).pad(2) + '-' +
                        actual.getFullYear()
                    );

                    var full_date = actual.getDate().pad(2) + '/' + (actual.getMonth() + 1).pad(2) + '/' + actual.getFullYear();
                    $scope.date = full_date;
                    span.innerHTML = actual.getDate();

                    if (actual.getMonth() !== data.getMonth()) {
                        cell.className = 'text-muted';
                    } else {
                        if ((data.getDate() > actual.getDate()) && (actual.getMonth() == present_month)) {
                            cell.className = 'previous';
                        } else {
                            cell.setAttribute('ng-click', 'viewDate("' + full_date + '")');
                        }
                    }
                    if (actual.getDate() == present_date && actual.getMonth() == present_month)
                        cell.className = 'today';

                    actual.setDate(actual.getDate() + 1);
                    $compile(cell)($scope);
                    row.appendChild(cell);
                }
                e.appendChild(row);
            }
            setTimeout(function() {
                e.className = 'active';
                original.className +=
                    diff === 0 ? ' hidden-right' : ' hide-left';
            }, 20);
            original.className = 'inactive';

            setTimeout(function() {
                var inactives = document.getElementsByClassName('inactive');
                for (var i = 0; i < inactives.length; i++)
                    widget.removeChild(inactives[i]);
            }, 1000);
        }
        $timeout(function() { calendari(document.getElementById('calendar'), new Date()); });
    };
    $scope.loadContent();

    $scope.date = '';
    $scope.viewDate = function(date) {
        $scope.is_loading_time = true;
        if ($scope.date != '') {
            removeClassByClass($scope.date.split("/").join("-"), "item-divider");
            removeClassByClass($scope.date.split("/").join("-"), "item-divider-custom");
            addClassByClass(date.split("/").join("-"), "item-divider");
            addClassByClass(date.split("/").join("-"), "item-divider-custom");
        }
        $scope.date = date;

        Appointment.availabletimelist($scope.location_id, $scope.category_id, $scope.service_id, $scope.provider_id, date).success(function(data) {
            if (data.status == "success") {
                $scope.is_loading_time = true;
                $scope.time_persent = true;
                $scope.showTime = true;
                $scope.no_time = false;
                $scope.displayTime = data.data.displayTime;
                $scope.service_time = data.data.serviceTime;
                $scope.sId = data.data.sId;
                $scope.morningTime = {};
                $scope.afternoonTime = {};
                $scope.eveningTime = {};
                var d = new Date(),isToday = false,t=0;
                var dd =    ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/'+ d.getFullYear();
                if(date == dd){
                    isToday = true;
                    t = (d.getHours() * 3600) + (d.getMinutes() *60) ;
                } 
                for (var key in data.data.displayTime) {
                    if(isToday && key < t){
                        continue;
                    }
                    if (key < 43200) {
                        $scope.morningTime[key] = data.data.displayTime[key];
                    }
                    if (key >= 43200 && key < 61200) {
                        $scope.afternoonTime[key] = data.data.displayTime[key];
                    }
                    if (key >= 61200) {
                        $scope.eveningTime[key] = data.data.displayTime[key];
                    }
                }
            } else {
                $scope.is_loading_time = true;
                $scope.time_persent = false;
                $scope.showTime = true;
                $scope.no_time = true;
                $scope.message = data.message;
            }

            $scope.goBack = function() {
                $state.go("appointment-view", { value_id: $scope.value_id });
            };
            $scope.loadlocation = function(index) {
                $ionicTabsDelegate.select(index);
                $scope.showLocations = true;
                $scope.showCategories = false;
                $scope.showServices = false;
                $scope.showProviders = false;
                $scope.showCalendar = false;
                $scope.showTime = false;

                Appointment.getLocations().success(function(data) {
                    $scope.locations = data.locations;
                }).finally(function() {
                    $scope.is_loading_time = false;
                });
            };

            $scope.loadcategory = function(index) {
                $ionicTabsDelegate.select(index);
                $scope.showLocations = false;
                $scope.showCategories = true;
                $scope.showServices = false;
                $scope.showProviders = false;
                $scope.showCalendar = false;
                $scope.showTime = false;
            };

            $scope.loadservice = function(index) {
                $ionicTabsDelegate.select(index);
                $scope.showLocations = false;
                $scope.showCategories = false;
                $scope.showServices = true;
                $scope.showProviders = false;
                $scope.showCalendar = false;
                $scope.showTime = false;
            };

            $scope.loadprovider = function(index) {
                $ionicTabsDelegate.select(index);
                $scope.showLocations = false;
                $scope.showCategories = false;
                $scope.showServices = false;
                $scope.showProviders = true;
                $scope.showCalendar = false;
                $scope.showTime = false;
            };
        }).finally(function() {
            $scope.is_loading_time = false;
        });
        return ($scope.showTime ? $scope.showTime = false : $scope.showTime = true)



    };

    $scope.gotoDateTime = function(k, v) {
        $ionicTabsDelegate.select(5);
        $timeout(function() {
            $ionicScrollDelegate.scrollTop();
        }, 100);

        if (!$scope.is_logged_in) {
            $scope.$on(AUTH_EVENTS.loginSuccess, function() {
                $scope.is_logged_in = true;
                $scope.gotoDateTime();
                $scope.time = v;
                $scope.time_value = k;
            });
            $scope.login();
            return;
        }
        $scope.time = v;
        $scope.time_value = k;
        Customer.find().success(function(data) {
            $scope.input.customer_id = data.id;
            $scope.input.Name = data.firstname + " " + data.lastname;
            $scope.input.Email = data.email;
        });

        $scope.showCalendar = false;
        $scope.showTime = false;
        $scope.showInformation = true;
        $scope.input = Authorization;

        $scope.loadlocation = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = true;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = false;

            Appointment.getLocations().success(function(data) {
                $scope.locations = data.locations;
            }).finally(function() {
                $scope.is_loading = false;
            });
        };

        $scope.loadcategory = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = true;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = false;
        };

        $scope.loadservice = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = true;
            $scope.showProviders = false;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = false;
        };
        $scope.loadprovider = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = true;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = false;
        };
        $scope.loaddate = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = true;
            $scope.showTime = false;
            $scope.showInformation = false;
        }
    };

    $scope.gotoInformation = function() {
        $ionicTabsDelegate.select(6);
        $timeout(function() {
            $ionicScrollDelegate.scrollTop();
        }, 100);

        $scope.showInformation = false;
        $scope.showConfirmInformation = true;

        $scope.loadlocation = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = true;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = false;
            $scope.showConfirmInformation = false;

            Appointment.getLocations().success(function(data) {
                $scope.locations = data.locations;
            }).finally(function() {
                $scope.is_loading = false;
            });
        };

        $scope.loadservice = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = true;
            $scope.showProviders = false;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = false;
            $scope.showConfirmInformation = false;
        };
        $scope.loadprovider = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = true;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = false;
            $scope.showConfirmInformation = false;
        };
        $scope.loaddate = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = true;
            $scope.showTime = false;
            $scope.showInformation = false;
            $scope.showConfirmInformation = false;
        };
        $scope.loadinfo = function(index) {
            $ionicTabsDelegate.select(index);
            $scope.showLocations = false;
            $scope.showCategories = false;
            $scope.showServices = false;
            $scope.showProviders = false;
            $scope.showCalendar = false;
            $scope.showTime = false;
            $scope.showInformation = true;
            $scope.showConfirmInformation = false;
        }
    };

    $scope.gotoBookAppointment = function() {
        $scope.is_loading = true;
        $scope.showLocations = false;
        $scope.showServices = false;
        $scope.showCategories = false;
        $scope.showProviders = false;
        $scope.showTime = false;
        $scope.showCalendar = false;
        $scope.showInformation = false;
        $scope.showConfirmInformation = false;
        $scope.thankyoupage = true;
        Appointment.bookappointment($scope.location_id, $scope.category_id, $scope.service_id, $scope.provider_id, $scope.date, $scope.time, $scope.time_value, $scope.service_time, $scope.sId, $scope.input).success(function(data) {
            if (data.status == "success") {
                $scope.appointment_success = true;
                $scope.success = $translate.instant("Thank You!");
                Appointment.getnotificationstatus($scope.input['customer_id']).success(function(data) {
                    if (data.status == true) {
                        $scope.notification_time = data.notification_time;
                    } else {
                        $scope.notification_time = 2;
                    }

                }).finally(function() {
                    $scope.is_loading = false;
                });
            } else {
                $scope.appointment_error = true;
                $scope.error = data.message;
            }
            $scope.goBack = function() {
                $state.go("appointment-view", { value_id: $scope.value_id });
            };
        }).finally(function() {
            $scope.is_loading = false;
        });



        $scope.loadlocation = false;
        $scope.loadcategory = false;
        $scope.loadservice = false;
        $scope.loadprovider = false;
        $scope.loaddate = false;
        $scope.loadinfo = false;

        $scope.goBack = function() {
            $state.go("appointment-view", { value_id: $scope.value_id });
        }
    }
});
