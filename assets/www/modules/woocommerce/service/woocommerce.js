App.service('WoocommerceManager', function(_, $ionicLoading, $translate) {

    var service = {};

    service.init = function() {
        service.categories = null;
        service.category_tree = null;
        service.site_url = null;
        service.tax = null;
        service.value_id = null;
        service.customer_mail = null;
        service.current_order = null;
        service.cart = {
            qty: 0,
            products: []
        };
    };

    service.addToCart = function(product) {
        var exists = false;
        var new_product_qty = parseInt(product.quantity_in_cart);

        service.cart.qty = parseInt(service.cart.qty) + new_product_qty;
        angular.forEach(service.cart.products, function(cart_product) {
           if(product.id == cart_product.id) {
               //Product already exists in cart we update
               if(product.variations.length) {
                   if(product.selected_variation == cart_product.selected_variation) {
                       exists = true;
                       cart_product.quantity_in_cart += new_product_qty;
                   }
               } else {
                   exists = true;
                   cart_product.quantity_in_cart += new_product_qty;
               }
           }
        });

        if(!exists) {
            //We add the product
            service.cart.products.push(product);
        }

        service.saveCart();

    };

    service.getCartQty = function() {
        return parseInt(service.cart.qty);
    };

    service.getCartTotal = function() {
        var cart_total = 0;
        angular.forEach(service.cart.products, function(cart_product) {
            cart_total += (parseFloat(cart_product.price) * parseInt(cart_product.quantity_in_cart));
        });

        if(service.tax) {
            cart_total = cart_total + ((cart_total * parseFloat(service.tax.rate))/100);
        }

        return cart_total.toFixed(2);
    };

    service.emptyCart = function() {
        service.cart = {
            qty: 0,
            products: []
        };

        service.saveCart();
    };

    service.saveCart = function() {
        if(typeof localStorage != 'undefined') {
            var cart_json = JSON.stringify(service.cart);
            localStorage.setItem("woocommerce_cart_" + service.value_id, cart_json);
        }
    };

    service.saveMail = function() {
        if(typeof localStorage != 'undefined') {
            var mail_json = JSON.stringify(service.customer_mail);
            localStorage.setItem("woocommerce_customer_mail_" + service.value_id, mail_json);
        }
    };

    service.getSavedCart = function() {
        if(localStorage.getItem("woocommerce_cart_" + service.value_id) != null) {
            var cart_json = localStorage.getItem("woocommerce_cart_" + service.value_id);
            service.cart = JSON.parse(cart_json);
        }
    };

    service.getSavedMail = function() {
        if(localStorage.getItem("woocommerce_customer_mail_" + service.value_id) != null) {
            var mail_json = localStorage.getItem("woocommerce_customer_mail_" + service.value_id);
            service.customer_mail = JSON.parse(mail_json);
        }
    };

    service.showLoading = function () {
        $ionicLoading.show({
            template: "<ion-spinner class=\"spinner-custom\"></ion-spinner><br/><br/>" + $translate.instant("Loading") + "..."
        });
    };

    service.hideLoading = function () {
        $ionicLoading.hide();
    };

    service.generateBreadcrumbs = function(category_id, category_children) {
        if(service.categories) {

            if(!service.category_tree) {
                service.category_tree = service.parseArr(service.categories);
            }

            _.forEach(category_children, function(val, key, index) {
                category_children[key].parent = {
                    "id": category_id,
                    "name": service.category_tree[category_id].name
                };

                if(!_.isObject(service.category_tree[category_children[key].id])) {
                    service.category_tree[category_children[key].id] = category_children[key];
                }
            });

            if(_.isObject(service.category_tree[category_id])) {

                var bead = new Array();
                var parent = service.category_tree[category_id].parent;
                while(parent) {
                    bead.push(service.category_tree[parent.id]);
                    parent = service.category_tree[parent.id].parent;
                }

                return bead.reverse();

            } else {
                return null;
            }
        } else {
            return null;
        }
    };

    service.parseArr = function(arr, parent) {
        var parsed = {};

        _.forEach(arr, function(val, key, index) {
            if(_.isObject(val)) {
                var id = _.get(val, "id");
                if(id > 0) {
                    parsed[id] = _.merge(_.omit(val, "children"), { parent: parent || null });
                    var children = _.get(val, "children");
                    if(_.isArray(children)) {
                        _.merge(parsed, service.parseArr(children, parsed[id]));
                    }
                }
            }
        });

        return parsed;
    };

    if(typeof WoocommerceManager == "undefined") {
        service.init();
    }

    return service;
});
