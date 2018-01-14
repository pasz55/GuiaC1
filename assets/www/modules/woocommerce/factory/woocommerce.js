App.factory('Woocommerce', function($q, $rootScope, $http, Url, WoocommerceManager) {

    var factory = {};

    factory.value_id = null;

    factory.loadContent = function() {
        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/load",{value_id: this.value_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.execWooQuery = function(action_call) {
        return $http({
            method: 'POST',
            url: Url.get("woocommerce/mobile_view/execwoocommerce"),
            data: {value_id: this.value_id, action_call: action_call},
            cache: false,
            responseType:'json'
        });
    };

    factory.getCategoriesHierarchical = function() {

        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/gethierarchicalcategories", {value_id: this.value_id}),
            cache: false,
            responseType:'json'
        });

    };

    factory.getAllProducts = function(page, category, product_id) {

        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/getallproducts", {value_id: this.value_id, page: page, category: category, product_id: product_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.getProduct = function(product_id) {
        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/getproduct", {value_id: this.value_id, id: product_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.getCategoryDetails = function(category_id, page) {
        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/getcategorydetails", {value_id: this.value_id, id: category_id, page:page}),
            cache: false,
            responseType:'json'
        });
    };

    factory.createCustomer = function(customer) {
        return $http({
            method: 'POST',
            url: Url.get("woocommerce/mobile_view/createcustomer"),
            data: {value_id: this.value_id, customer: JSON.stringify(customer)},
            cache: false,
            responseType:'json'
        });
    };

    factory.checkCustomer = function(mail) {
        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/checkcustomer", {value_id: this.value_id, mail: mail}),
            cache: false,
            responseType:'json'
        });
    };

    factory.createOrder = function(order) {
        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/createorder", {value_id: this.value_id, order: JSON.stringify(order)}),
            cache: false,
            responseType:'json'
        });
    };

    factory.getGroupedDetails = function(parent_id) {
        return $http({
            method: 'GET',
            url: Url.get("woocommerce/mobile_view/groupeddetails", {value_id: this.value_id, parent_id: parent_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.payByStripe = function(card_token, order) {
        return $http({
            method: 'POST',
            url: Url.get("woocommerce/mobile_view/paybycreditcard"),
            data: {value_id: this.value_id, token: JSON.stringify(card_token), order: JSON.stringify(order)},
            cache: false,
            responseType:'json'
        });
    };

    factory.getPaypalUrl = function(order) {
        return $http({
            method: 'POST',
            url: Url.get("woocommerce/mobile_view/getpaypalurl"),
            data: {value_id: this.value_id, order: JSON.stringify(order)},
            cache: false,
            responseType:'json'
        });
    };

    return factory;
});
