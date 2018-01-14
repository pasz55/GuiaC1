App.factory('Appointment', function($rootScope, $http, Url) {
    var factory = {};
    factory.value_id = null;
    factory.settings = {};

    factory.getSettings = function() {
        if (!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("appointment/mobile_view/settings", { value_id: this.value_id }),
            cache: false,
            responseType: 'json'
        });
    };

    factory.getLocations = function() {

        if (!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("appointment/mobile_view/index", { value_id: this.value_id }),
            cache: false,
            responseType: 'json'
        });
    };

    factory.getcategories = function(location_id) {

        if (!this.value_id && location_id) return;

        return $http({
            method: 'GET',
            url: Url.get("appointment/mobile_view/getcategories", { value_id: this.value_id, location_id: location_id }),
            cache: false,
            responseType: 'json'
        });
    };

    factory.getservices = function(location_id, category_id) {

        if (!this.value_id && location_id && category_id) return;

        return $http({
            method: 'GET',
            url: Url.get("appointment/mobile_view/getservices", { value_id: this.value_id, location_id: location_id, category_id: category_id }),
            cache: false,
            responseType: 'json'
        });
    };

    factory.getproviders = function(location_id, category_id, service_id) {

        if (!this.value_id && location_id && category_id && service_id) return;

        return $http({
            method: 'GET',
            url: Url.get("appointment/mobile_view/getproviders", { value_id: this.value_id, location_id: location_id, category_id: category_id, service_id: service_id }),
            cache: false,
            responseType: 'json'
        });
    };

    factory.availabletimelist = function(location_id, category_id, service_id, provider_id, date) {
        if (!location_id && category_id && service_id && provider_id && date) return;


        var url = Url.get("appointment/mobile_view/availabletimelist");
        var data = {
            location_id:location_id, service_id: service_id, provider_id: provider_id, date: date, value_id: this.value_id
        };
        return $http.post(url, data);
    };

    factory.bookappointment = function(location_id, category_id, service_id, provider_id, date, time, time_value, service_time,sId, input) {
        if (!this.value_id && location_id && category_id && service_id && provider_id && input) return;
        return $http({
            method: 'POST',
            url: Url.get("appointment/mobile_view/bookappointment"),
            data: { value_id: this.value_id, location_id: location_id, category_id: category_id, service_id: service_id ,provider_id: provider_id,date: date, time: time, time_value: time_value, service_time: service_time, sId:sId, input: input},
            cache: false,
            responseType: 'json'
        });
    };

    factory.displayappointmentlist = function(customer_id) {
        if (!this.value_id && customer_id) return;

        return $http({
            method: 'GET',
            url: Url.get("appointment/mobile_view/displayappointmentlist", { value_id: this.value_id, customer_id: customer_id}),
            cache: false,
            responseType: 'json'
        });
    };

    factory.cancelappointment = function(status, appointment_id,cancel_event_by_provider) {
        return $http({
            method: 'POST',
            url: Url.get("appointment/mobile_view/cancelappointment"),
            data: { value_id: this.value_id, status: 3, appointment_id: appointment_id, cancel_event_by_provider: 1 },
            cache: false,
            responseType: 'json'
        });
    };

    factory.appointmentnotify = function(customer_id,index) {
        return $http({
            method: 'POST',
            url: Url.get("appointment/mobile_view/appointmentnotify"),
            data: { value_id: this.value_id, customer_id: customer_id, index: index },
            cache: false,
            responseType: 'json'
        });
    };

    factory.displayappointmentlist = function(customer_id) {
        if (!this.value_id && customer_id) return;

        return $http({
            method: 'GET',
            url: Url.get("appointment/mobile_view/displayappointmentlist", { value_id: this.value_id, customer_id: customer_id}),
            cache: false,
            responseType: 'json'
        });
    };

    factory.getnotificationstatus = function(customer_id) {
        return $http({
            method: 'POST',
            url: Url.get("appointment/mobile_view/getnotificationstatus"),
            data: { value_id: this.value_id, customer_id: customer_id},
            cache: false,
            responseType: 'json'
        });
    };
    return factory;
});

App.factory('Authorization', function() {

    authorization = {};
    authorization.Name = "";
    authorization.Email = "";
    authorization.PhoneNo = "";
    authorization.customer_id = "";
    return authorization;
});
