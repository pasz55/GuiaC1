App.config(function($stateProvider) {
    $stateProvider.state('woocommerce-home', {
        url: BASE_PATH+"/woocommerce/mobile_view/index/value_id/:value_id",
        controller: 'WoocommerceHomeController',
        templateUrl: "modules/woocommerce/templates/l1/home.html",
        cache:false
    }).state('woocommerce-categories', {
        url: BASE_PATH+"/woocommerce/mobile_view/categories/value_id/:value_id",
        controller: 'WoocommerceCategoriesController',
        templateUrl: "modules/woocommerce/templates/l1/categories.html",
        cache:false
    }).state('woocommerce-products', {
        url: BASE_PATH+"/woocommerce/mobile_view/products/value_id/:value_id",
        controller: 'WoocommerceProductsController',
        templateUrl: "modules/woocommerce/templates/l1/products.html",
        cache:false
    }).state('woocommerce-product', {
        url: BASE_PATH+"/woocommerce/mobile_view/product/value_id/:value_id/product_id/:product_id",
        controller: 'WoocommerceProductController',
        templateUrl: "modules/woocommerce/templates/l1/product.html",
        cache:false
    }).state('woocommerce-category', {
        url: BASE_PATH+"/woocommerce/mobile_view/category/value_id/:value_id/category_id/:category_id",
        controller: 'WoocommerceCategoryController',
        templateUrl: "modules/woocommerce/templates/l1/category.html",
        cache:false
    }).state('woocommerce-cart', {
        url: BASE_PATH+"/woocommerce/mobile_view/cart/value_id/:value_id/",
        controller: 'WoocommerceCartController',
        templateUrl: "modules/woocommerce/templates/l1/cart.html",
        cache:false
    }).state('woocommerce-customer', {
        url: BASE_PATH+"/woocommerce/mobile_view/customer/value_id/:value_id/",
        controller: 'WoocommerceCustomerController',
        templateUrl: "modules/woocommerce/templates/l1/customer.html",
        cache:false
    }).state('woocommerce-grouped-products', {
        url: BASE_PATH+"/woocommerce/mobile_view/grouped/value_id/:value_id/parent_id/:parent_id",
        controller: 'WoocommerceGroupedController',
        templateUrl: "modules/woocommerce/templates/l1/products.html",
        cache:false
    }).state('woocommerce-stripe', {
        url: BASE_PATH+"/woocommerce/mobile_view/stripe/value_id/:value_id",
        controller: 'WoocommerceStripeController',
        templateUrl: "modules/woocommerce/templates/l1/stripe.html",
        cache:false
    }).state('woocommerce-success', {
        url: BASE_PATH+"/woocommerce/mobile_view/success/value_id/:value_id/order_id/:order_id",
        controller: 'WoocommerceSuccessController',
        templateUrl: "modules/woocommerce/templates/l1/success.html",
        cache:false
    }).state('woocommerce-success-bis', {
        url: BASE_PATH+"/woocommerce/mobile_view/success/value_id/:value_id",
        controller: 'WoocommerceSuccessController',
        templateUrl: "modules/woocommerce/templates/l1/success.html",
        cache:false
    }).state('woocommerce-cancel', {
        url: BASE_PATH+"/woocommerce/mobile_view/cancel/value_id/:value_id/order_id/:order_id",
        controller: 'WoocommerceCancelController',
        templateUrl: "modules/woocommerce/templates/l1/cancel.html",
        cache:false
    }).state('woocommerce-cancel-bis', {
        url: BASE_PATH+"/woocommerce/mobile_view/cancel/value_id/:value_id",
        controller: 'WoocommerceCancelController',
        templateUrl: "modules/woocommerce/templates/l1/cancel.html",
        cache:false
    });
}).controller('WoocommerceHomeController', function($rootScope, $scope, $stateParams, $state, $translate, $window, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = WoocommerceManager.value_id = $stateParams.value_id;
    WoocommerceManager.getSavedCart();
    WoocommerceManager.getSavedMail();

    $scope.cart_qty = WoocommerceManager.getCartQty();
    $scope.store_url = null;

    $scope.loading = true;
    WoocommerceManager.showLoading();

    Woocommerce.loadContent().success(function(data) {
        if(data && data.page_title) {
            $scope.page_title = data.page_title;
            $scope.woo_data = data.woo_data;

            WoocommerceManager.store_url = $scope.store_url = data.woo_data.store_url;
            WoocommerceManager.stripe_enabled = data.woo_data.stripe_enabled;
            WoocommerceManager.paypal_enabled = data.woo_data.paypal_enabled;
            WoocommerceManager.stripe_publishable_key = data.woo_data.stripe_publishable_key;
            WoocommerceManager.stripe_secret_key = data.woo_data.stripe_secret_key;
            WoocommerceManager.tax = data.woo_data.tax;
        }

        WoocommerceManager.hideLoading();
        $scope.loading = false;
    });

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

    $scope.openLink = function(url) {
        if($rootScope.isOverview) {
            $rootScope.showMobileFeatureOnlyError();
            return;
        }

        $window.open(url, '_system');
    };

}).controller('WoocommerceCategoriesController', function($scope, $stateParams, $state, $translate, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;

    $scope.cart_qty = WoocommerceManager.getCartQty();
    $scope.categories = null;

    WoocommerceManager.showLoading();

    $scope.page_title = $translate.instant("Categories");

    Woocommerce.getCategoriesHierarchical().success(function (data) {
        $scope.categories = data.woo_data;
        WoocommerceManager.hideLoading();
    }).error(function(data) {
        $scope.categories = {};
        WoocommerceManager.hideLoading();
    });

    $scope.showCategory = function (category_id) {
        $state.go("woocommerce-category", {value_id: $scope.value_id, category_id: category_id});
    };

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

}).controller('WoocommerceProductsController', function($scope, $state, $stateParams, $timeout, $translate, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;
    $scope.cart_qty = WoocommerceManager.getCartQty();

    WoocommerceManager.showLoading();

    $scope.last_fetch = 6;
    $scope.current_page = 1;
    $scope.is_loading_more = false;
    $scope.page_title = $translate.instant("All products");
    $scope.products = null;

    Woocommerce.getAllProducts($scope.current_page, null).success(function(data) {
        $scope.products = data.woo_data;
        $scope.last_fetch = $scope.products.length;
    }).error(function(data) {
        $scope.products = {};
    }).finally(function() {
        WoocommerceManager.hideLoading();
    });

    $scope.hasMoreProducts = function() {
        return ($scope.last_fetch > 0);
    };

    $scope.loadMoreProducts = function() {
        if(!$scope.is_loading_more) {
            $scope.is_loading_more = true;
            WoocommerceManager.showLoading();
            $scope.current_page++;
            Woocommerce.getAllProducts($scope.current_page, null).success(function(data) {

                if(data && data.woo_data.length) {
                    $scope.products = ($scope.products || []).concat(data.woo_data);
                }

                $scope.last_fetch = data.woo_data.length;

                $timeout(function() {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, 500);

                WoocommerceManager.hideLoading();
                $scope.is_loading_more = false;
            });
        }
    };

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

}).controller('WoocommerceProductController', function($scope, $stateParams, $state, $timeout, $translate, SafePopups, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;
    $scope.product_id = $stateParams.product_id;
    $scope.quantity = {value: 1};
    $scope.cart_qty = WoocommerceManager.getCartQty();
    $scope.displayed_price = null;
    $scope.selected_option = {
        id: null
    };
    $scope.loading = true;
    WoocommerceManager.showLoading();

    $scope.page_title = null;

    Woocommerce.getProduct($scope.product_id).success(function (data) {
        $scope.product = data.woo_data.product;
        $scope.reviews = data.woo_data.reviews;

        if($scope.product.variations.length && $scope.product.variations[0].attributes[0].option != "") {
            var nice_price = $scope.product.price_html;
            var splitted = nice_price.split('<span class="woocommerce-Price-currencySymbol">');
            var resplitted = splitted[1].split('<');
            var currency_symbol = resplitted[0];
            var raw_price = parseFloat($scope.product.variations[0].price);
            if(WoocommerceManager.tax) {
                raw_price = raw_price + ((raw_price * WoocommerceManager.tax.rate) /100);
                raw_price = raw_price.toFixed(2);
            }
            var new_price_html = '<span class="woocommerce-Price-amount amount">' + raw_price + '<span class="woocommerce-Price-currencySymbol">' + currency_symbol +'</span></span>';

            $scope.displayed_price = new_price_html;
            $timeout(function() {
                $scope.selected_option.id = $scope.product.variations[0].id.toString();
            });
        } else {
            $scope.displayed_price = $scope.product.price_html;
        }
        $scope.loading = false;
        WoocommerceManager.hideLoading();
    }).error(function(data) {
        $scope.product = null;
        $scope.loading = false;
        WoocommerceManager.hideLoading();
    });

    $scope.addToCart = function(new_product) {
        var product = angular.extend({}, new_product);
        product.quantity_in_cart = $scope.quantity.value;
        if($scope.selected_option.id) {
            product.selected_variation = $scope.selected_option.id;
            product.price_html = $scope.displayed_price;
        }
        WoocommerceManager.addToCart(product);
        $scope.cart_qty = WoocommerceManager.cart.qty;
        WoocommerceManager.current_order = null;
        SafePopups.show('show', {
            title: $translate.instant("Add To Cart"),
            subTitle: "<i class=\"icon ion-checkmark big-ionic-icon\"></i><br/>"+$translate.instant("Product successfully added to your Cart."),
            buttons: [{
                text: $translate.instant("OK"),
                type: 'button-custom'
            }]
        });
    };

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

    $scope.changeOption = function() {

        angular.forEach($scope.product.variations, function(variation, index) {
            if(variation.id == $scope.selected_option.id) {

                var nice_price = $scope.product.price_html;
                var splitted = nice_price.split('<span class="woocommerce-Price-currencySymbol">');
                var resplitted = splitted[1].split('<');
                var currency_symbol = resplitted[0];
                var price = WoocommerceManager.tax ? parseFloat(variation.price) + ((parseFloat(variation.price) * WoocommerceManager.tax.rate)/100) : variation.price;
                var new_price_html = '<span class="woocommerce-Price-amount amount">' + price.toFixed(2) + '<span class="woocommerce-Price-currencySymbol">' + currency_symbol +'</span></span>';

                $scope.displayed_price = new_price_html;
                $scope.product.price = variation.price.toFixed(2);

            }
        });
    };

}).controller('WoocommerceCategoryController', function($scope, $stateParams, $state, $timeout, $translate, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;
    $scope.category_id = $stateParams.category_id;
    $scope.cart_qty = WoocommerceManager.getCartQty();
    $scope.last_fetch = 6;
    $scope.current_page = 1;
    $scope.is_loading_more = false;
    $scope.beadcrumb = null;
    $scope.products = null;

    WoocommerceManager.showLoading();

    $scope.page_title = "";

    Woocommerce.getCategoryDetails($scope.category_id, $scope.current_page).success(function (data) {
        $scope.category = data.woo_data.category;
        $scope.page_title = $scope.category.name;
        $scope.children = data.woo_data.children;
        $scope.products = data.woo_data.products;

        $scope.beadcrumb = WoocommerceManager.generateBreadcrumbs($scope.category_id, $scope.children);

        WoocommerceManager.hideLoading();
    });

    $scope.hasMoreProducts = function() {
        return ($scope.last_fetch > 0);
    };

    $scope.loadMoreProducts = function() {
        if(!$scope.is_loading_more) {
            $scope.is_loading_more = true;
            WoocommerceManager.showLoading();
            $scope.current_page++;
            Woocommerce.getAllProducts($scope.current_page, $scope.category_id).success(function(data) {

                if(data && data.woo_data.length) {
                    $scope.products = ($scope.products || []).concat(data.woo_data);
                }

                $scope.last_fetch = data.woo_data.length;

                $timeout(function() {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, 500);

                WoocommerceManager.hideLoading();
                $scope.is_loading_more = false;
            });
        }
    };

    $scope.showCategory = function (category_id) {
        if(category_id != $scope.category_id) {
            $state.go("woocommerce-category", {value_id: $scope.value_id, category_id: category_id});
        }
    };

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

}).controller('WoocommerceCartController', function($document, $rootScope, $scope, $stateParams, $state, $translate, $window, Application, SafePopups, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;

    WoocommerceManager.showLoading();

    $scope.page_title = $translate.instant("Your cart");

    $scope.cart = WoocommerceManager.cart;
    $scope.cart_total = WoocommerceManager.getCartTotal();
    $scope.customer = {
        mail: WoocommerceManager.customer_mail
    };

    $scope.current_order = WoocommerceManager.current_order ? WoocommerceManager.current_order : null;
    $scope.paymentStep = WoocommerceManager.current_order ? true : false;
    $scope.stripe_enabled = WoocommerceManager.current_order ? WoocommerceManager.stripe_enabled : false;
    $scope.paypal_enabled = WoocommerceManager.current_order ? WoocommerceManager.paypal_enabled : false;

    WoocommerceManager.hideLoading();

    $scope.proceedCart = function() {
        WoocommerceManager.showLoading();
        Woocommerce.checkCustomer($scope.customer.mail).success(function(data) {

            WoocommerceManager.customer_mail = $scope.customer.mail;
            WoocommerceManager.saveMail();
            var line_items = [];
            angular.forEach(WoocommerceManager.cart.products, function(cart_product) {
                var data = {product_id: cart_product.id, quantity: cart_product.quantity_in_cart};
                if(cart_product.selected_variation) {
                    data.variation_id = cart_product.selected_variation;
                }
                line_items.push(data);
            });
            var customer_id = data.customer[0].id;

            $scope.stripe_enabled = WoocommerceManager.stripe_enabled;
            $scope.paypal_enabled = WoocommerceManager.paypal_enabled;
            $scope.customer_name = data.customer[0].first_name + " " + data.customer[0].last_name;

            var order_data = {
                customer_id: customer_id,
                line_items: line_items,
                billing: data.customer[0].billing,
                shipping: data.customer[0].shipping
            };

            Woocommerce.createOrder(order_data).success(function(data) {
                $scope.current_order = WoocommerceManager.current_order = data.woo_data;
                $scope.current_order.total_ht = parseFloat($scope.current_order.total) - parseFloat($scope.current_order.total_tax);
                $scope.paymentStep = true;
            }).error(function(data) {
                SafePopups.show('show', {
                    title: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+$translate.instant("Error during order creation"),
                    buttons: [{
                        text: $translate.instant("OK"),
                        type: 'button-custom'
                    }]
                });
            }).then(function() {
                WoocommerceManager.hideLoading();
            });


        }).error(function() {
            SafePopups.show('show', {
                title: $translate.instant("Customer error"),
                subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+$translate.instant("This customer doesn't exists in our database or is an administrator account. Please register."),
                buttons: [{
                    text: $translate.instant("OK"),
                    type: 'button-custom'
                }]
            });
            $state.go("woocommerce-customer", {value_id: $scope.value_id});
            $scope.customer.mail = null;
            WoocommerceManager.hideLoading();
        });
    };

    $scope.removeCartItem = function(product_id) {

        var confirmPopup = SafePopups.show("confirm",{
            title: $translate.instant("Remove product"),
            template: $translate.instant("Are you sure to remove this line from cart?")
        });

        confirmPopup.then(function(res) {
            var qty;
            if(res) {
                angular.forEach(WoocommerceManager.cart.products, function(cart_product, index) {
                    if(cart_product.id == product_id) {
                        qty = cart_product.quantity_in_cart;
                        WoocommerceManager.cart.products.splice(index, 1);
                        WoocommerceManager.cart.qty -= qty;
                    }
                });
                $scope.resetCurrentOrder();
                WoocommerceManager.saveCart();
            }
        });
    };

    $scope.resetCurrentOrder = function() {
        $scope.current_order = WoocommerceManager.current_order = null;
        $scope.paymentStep = false;
    };

    $scope.changeEmail = function() {
        $scope.resetCurrentOrder();
    };

    $scope.changeQty = function() {
        $scope.cart_total = WoocommerceManager.getCartTotal();
        $scope.resetCurrentOrder();
        WoocommerceManager.saveCart();
    };

    $scope.payOnline = function() {
        var url = WoocommerceManager.store_url + "/index.php/my-account/orders";
        $window.open(url, "_system");
        $scope.resetCurrentOrder();
        WoocommerceManager.emptyCart();
        $scope.goTo("home");
    };

    $scope.payStripe = function() {
        $scope.goTo("stripe");
    };

    $scope.payPaypal = function() {

        if($rootScope.isOverview) {
            $rootScope.showMobileFeatureOnlyError();
            return;
        }

        WoocommerceManager.showLoading();
        Woocommerce.getPaypalUrl($scope.current_order).success(function(data) {

            if(Application.is_webview) {
                $window.location = data.url;
            } else {
                var browser = window.open(data.url, $rootScope.getTargetForLink(), 'location=yes');

                browser.addEventListener('loadstart', function (event) {

                    if (/(woocommerce\/mobile_view\/success)/.test(event.url)) {

                        browser.close();
                        WoocommerceManager.current_order = null;
                        WoocommerceManager.emptyCart();
                        $scope.goTo("success");

                    } else if (/(woocommerce\/mobile_view\/cancel)/.test(event.url)) {

                        browser.close();
                        $scope.goTo("cancel");

                    }
                });
            }

        }).error(function() {
            SafePopups.show('show', {
                title: $translate.instant("Error"),
                subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+$translate.instant("An error occurred while trying to set up Paypal transaction. Please contact an administrator."),
                buttons: [{
                    text: $translate.instant("OK"),
                    type: 'button-custom'
                }]
            });
        }).finally(function() {
            WoocommerceManager.hideLoading();
        });
    };

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

}).controller('WoocommerceCustomerController', function($scope, $stateParams, $state, $translate, SafePopups, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;
    $scope.cart_qty = WoocommerceManager.getCartQty();
    $scope.choice = {
        billing_address_is_shipping_address: false
    };

    WoocommerceManager.showLoading();

    $scope.customer = {};
    $scope.billing_address = {};
    $scope.shipping_address = {};
    $scope.customer.edit = true;

    WoocommerceManager.hideLoading();

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

    $scope.createCustomer = function() {

        if($scope.choice.billing_address_is_shipping_address) {
            $scope.shipping_address = {
                first_name: $scope.billing_address.first_name,
                last_name: $scope.billing_address.last_name,
                company: $scope.billing_address.company,
                address_1: $scope.billing_address.address_1,
                address_2: $scope.billing_address.address_2,
                city: $scope.billing_address.city,
                state: $scope.billing_address.state,
                postcode: $scope.billing_address.postcode,
                country: $scope.billing_address.country
            }
        }

        var data = {
            customer: {
                email: $scope.customer.email,
                first_name: $scope.customer.first_name,
                last_name: $scope.customer.last_name,
                username: $scope.customer.username,
                password: $scope.customer.password,
                billing: {
                    first_name: $scope.billing_address.first_name,
                    last_name: $scope.billing_address.last_name,
                    company: $scope.billing_address.company,
                    address_1: $scope.billing_address.address_1,
                    address_2: $scope.billing_address.address_2,
                    city: $scope.billing_address.city,
                    state: $scope.billing_address.state,
                    postcode: $scope.billing_address.postcode,
                    country: $scope.billing_address.country,
                    email: $scope.billing_address.email,
                    phone: $scope.billing_address.phone
                },
                shipping: {
                    first_name: $scope.shipping_address.first_name,
                    last_name: $scope.shipping_address.last_name,
                    company: $scope.shipping_address.company,
                    address_1: $scope.shipping_address.address_1,
                    address_2: $scope.shipping_address.address_2,
                    city: $scope.shipping_address.city,
                    state: $scope.shipping_address.state,
                    postcode: $scope.shipping_address.postcode,
                    country: $scope.shipping_address.country
                }
            }
        };

        WoocommerceManager.showLoading();
        Woocommerce.createCustomer(data.customer).success(function(response_data) {
            SafePopups.show('show', {
                title: $translate.instant("Registration successful"),
                subTitle: "<i class=\"icon ion-checkmark big-ionic-icon\"></i><br/>"+$translate.instant("Your account has been created successfully"),
                buttons: [{
                    text: $translate.instant("OK"),
                    type: 'button-custom'
                }]
            });
            WoocommerceManager.customer_mail = data.customer.email;
            WoocommerceManager.saveMail();
            $scope.goTo("home");
        }).error(function(data) {
            SafePopups.show('show', {
                title: $translate.instant("Error during registration"),
                subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+data.woo_data,
                buttons: [{
                    text: $translate.instant("OK"),
                    type: 'button-custom'
                }]
            });
        }).finally(function() {
            WoocommerceManager.hideLoading();
        });
    };

}).controller('WoocommerceGroupedController', function($scope, $stateParams, $state, $translate, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;
    $scope.parent_id = $stateParams.parent_id;

    $scope.cart_qty = WoocommerceManager.getCartQty();

    WoocommerceManager.showLoading();

    $scope.page_title = $translate.instant("Grouped product details");

    Woocommerce.getGroupedDetails($scope.parent_id).success(function (data) {
        $scope.products = data.woo_data;
        WoocommerceManager.hideLoading();
    }).error(function(data) {
        $scope.products = {};
        WoocommerceManager.hideLoading();
    });

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

}).controller('WoocommerceStripeController', function($scope, $state, $stateParams, $timeout, $translate, SafePopups, Woocommerce, WoocommerceManager) {

    $scope.value_id = Woocommerce.value_id = $stateParams.value_id;
    $scope.card = {
        number: null,
        exp_month: null,
        exp_year: null,
        cvc: null
    };
    $scope.page_title = $translate.instant("Credit Card payment");

    if(typeof Stripe == "undefined") {
        WoocommerceManager.showLoading();
        var stripeJS = document.createElement('script');
        stripeJS.type = "text/javascript";
        stripeJS.src = "https://js.stripe.com/v2/";
        stripeJS.onload = function() {
            $timeout(function() {
                WoocommerceManager.hideLoading();
            });
        };
        document.body.appendChild(stripeJS);
    }

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

    $scope.proceed= function() {

        var error_messages = [];

        if(!($scope.card.number > 0))
            error_messages.push($translate.instant("Please enter a credit card number"));

        if(!($scope.card.exp_month > 0))
            error_messages.push($translate.instant("Please enter the credit card expiration month"));

        if(!($scope.card.exp_year > 0))
            error_messages.push($translate.instant("Please enter the credit card expiration year"));

        if(error_messages.length > 0) {
            SafePopups.show('show', {
                title: $translate.instant("Error"),
                subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+error_messages.shift(),
                buttons: [{
                    text: $translate.instant("OK"),
                    type: 'button-custom'
                }]
            });
            return;
        }

        Stripe.setPublishableKey(WoocommerceManager.stripe_publishable_key);
        WoocommerceManager.showLoading();
        try {
            Stripe.card.createToken($scope.card, function (status, response) {
                if (response.error) {
                    SafePopups.show('show', {
                        title: $translate.instant("Error"),
                        subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+response.error.message,
                        buttons: [{
                            text: $translate.instant("OK"),
                            type: 'button-custom'
                        }]
                    });
                    WoocommerceManager.hideLoading();
                } else {
                    $scope.card_token = {
                        token: response.id,
                        last4: response.card.last4,
                        brand: response.card.brand,
                        exp_month: response.card.exp_month,
                        exp_year: response.card.exp_year,
                        exp: Math.round(+(new Date((new Date(response.card.exp_year, response.card.exp_month, 1)) - 1)) / 1000) | 0
                    };

                    Woocommerce.payByStripe($scope.card_token, WoocommerceManager.current_order).success(function(data) {
                        if(data.success) {
                            $scope.goTo("success");
                        } else {
                            SafePopups.show('show', {
                                title: $translate.instant("Error"),
                                subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>" + $translate.instant("An error occurred while making your payment. Please try again later."),
                                buttons: [{
                                    text: $translate.instant("OK"),
                                    type: 'button-custom'
                                }]
                            });
                        }
                        WoocommerceManager.hideLoading();
                    }).error(function(data) {
                        SafePopups.show('show', {
                            title: $translate.instant("Error"),
                            subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+data.message,
                            buttons: [{
                                text: $translate.instant("OK"),
                                type: 'button-custom'
                            }]
                        });
                        WoocommerceManager.hideLoading();
                    });
                }
            }, function(status, response) {
                SafePopups.show('show', {
                    title: $translate.instant("Error"),
                    subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+response.error.message,
                    buttons: [{
                        text: $translate.instant("OK"),
                        type: 'button-custom'
                    }]
                });
                WoocommerceManager.hideLoading();
            });
        } catch (e) {
            WoocommerceManager.hideLoading();
            SafePopups.show('show', {
                title: $translate.instant("Error"),
                subTitle: "<i class=\"icon ion-alert-circled big-ionic-icon\"></i><br/>"+e,
                buttons: [{
                    text: $translate.instant("OK"),
                    type: 'button-custom'
                }]
            });
        }

    }

}).controller('WoocommerceSuccessController', function($scope, $stateParams, $state, $translate, $timeout, WoocommerceManager) {

    $scope.value_id = WoocommerceManager.value_id = $stateParams.value_id;

    $scope.success_txt1 = $translate.instant("Thank you!");
    $scope.success_txt2 = $translate.instant("Your payment has been done successfully.");
    $scope.success_txt3 = $translate.instant("See you soon on our store!");

    $scope.page_title = $translate.instant("Payment result");

    WoocommerceManager.getSavedCart();
    WoocommerceManager.emptyCart();

    $timeout(function() {
        $scope.goTo("home");
    }, 4000);

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

}).controller('WoocommerceCancelController', function($scope, $stateParams, $state, $translate) {
    $scope.value_id = $stateParams.value_id;

    $scope.cancel_txt1 = $translate.instant("Oops!");
    $scope.cancel_txt2 = $translate.instant("The payment has been cancelled, something wrong happened? Feel free to contact us.");

    $scope.page_title = $translate.instant("Order cancelled");

    $scope.goTo = function(state) {
        $state.go("woocommerce-" + state, {value_id: $scope.value_id});
    };

});
