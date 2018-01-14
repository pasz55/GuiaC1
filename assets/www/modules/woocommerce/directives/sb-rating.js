App.directive("sbRating", function() {
    var createHTML = function(r) {
        var html = '';
        var count = 0;

        while (r-- >= 1) {
            html += '<i class="icon ion-ios-star"> </i>';
            count++;
        }
        if (r >= -.5) {
            html += '<i class="icon ion-ios-star-half"> </i>';
            count++;
        }
        for (var i = 0; i < (5 - count); i++)
            html += '<i class="icon ion-ios-star-outline"> </i>';

        return html;
    }

    return {
        restrict: 'EA',
        scope: {
            rating: '='
        },
        link: function(scope, elem, attr) {
            scope.$watch('rating', function(newValue, oldValue, scope) {

                if (typeof newValue == 'string')
                    elem.html(createHTML(parseFloat(newValue)));
                else
                    elem.html(createHTML(newValue));
            });
        }
    }
});