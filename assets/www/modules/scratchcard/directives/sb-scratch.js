angular.module('starter').directive('sbScratch', function() {
    return {
        restrict: 'A',
        scope: {
            card: "=",
            valueId: "=",
            customerId: "=",
            endScratch: "&",
            log: "&"
        },
        template:
        '<div class="container item item-image" id="scratch-container" ng-show="image_is_loaded">' +
        '   <canvas class="canvas" id="scratch-canvas" width="{{ card_width }}px" height="{{ card_height }}px"></canvas>' +
        '   <img src="{{ background_image }}" />' +
        '</div>',
        controller: function($document, $ionicModal, $ionicPopup, $rootScope, $scope, $timeout, $translate, Url) {

            $scope.distanceBetween = function(point1, point2) {
                return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
            };

            $scope.angleBetween = function(point1, point2) {
                return Math.atan2( point2.x - point1.x, point2.y - point1.y );
            };

            $scope.getFilledInPixels = function(stride) {
                if (!stride || stride < 1) { stride = 1; }

                var pixels   = $scope.ctx.getImageData(0, 0, $scope.canvasWidth, $scope.canvasHeight),
                    pdata    = pixels.data,
                    l        = pdata.length,
                    total    = (l / stride),
                    count    = 0;

                for(var i = count = 0; i < l; i += stride) {
                    if (parseInt(pdata[i]) === 0) {
                        count++;
                    }
                }

                return Math.round((count / total) * 100);
            };

            $scope.getMouse = function(e, canvas) {
                var offsetX = 0, offsetY = 0, mx, my;

                if (canvas.offsetParent !== undefined) {
                    do {
                        offsetX += canvas.offsetLeft;
                        offsetY += canvas.offsetTop;
                    } while ((canvas = canvas.offsetParent));
                }

                $scope.ratioW = $scope.container.clientWidth/$scope.canvas.width;
                $scope.ratioH = $scope.container.clientHeight/$scope.canvas.height;

                mx = (e.pageX || e.touches[0].clientX) - offsetX;
                my = (e.pageY || e.touches[0].clientY) - offsetY;

                return {x: mx/$scope.ratioW, y: my/$scope.ratioH};
            };

            $scope.handlePercentage = function(filledInPixels) {
                filledInPixels = filledInPixels || 0;

                if(!$scope.attempt_is_logged) {
                    $scope.log({is_win: $scope.is_win, points_earned: $scope.points_earned});
                    $scope.attempt_is_logged = true;
                }

                if (filledInPixels > 75) {
                    $scope.handleScratchEnd();
                }
            };

            $scope.handleMouseDown = function(e) {
                e.stopPropagation();
                $scope.isDrawing = true;
                $scope.lastPoint = $scope.getMouse(e, $scope.canvas);
            };

            $scope.handleMouseMove = function(e) {
                if (!$scope.isDrawing) { return; }

                e.preventDefault();

                var currentPoint = $scope.getMouse(e, $scope.canvas),
                    dist = $scope.distanceBetween($scope.lastPoint, currentPoint),
                    angle = $scope.angleBetween($scope.lastPoint, currentPoint),
                    x, y;

                for (var i = 0; i < dist; i++) {
                    x = $scope.lastPoint.x + (Math.sin(angle) * i) - 25;
                    y = $scope.lastPoint.y + (Math.cos(angle) * i) - 25;
                    $scope.ctx.globalCompositeOperation = 'destination-out';

                    var reg = /^translate3d\(-?\d+px, (-?\d+)px, -?\d+px\)/;
                    var txt = document.getElementsByClassName("scroll")[0].style.transform;
                    var resultat = txt.match(reg);
                    var offset = 0;
                    if(resultat && resultat[1]) {
                       offset = parseInt(resultat[1]) + 25;
                    }
                    y -= offset;

                    $scope.ctx.drawImage($scope.brush, x, y);
                }

                $scope.lastPoint = currentPoint;
                $scope.handlePercentage($scope.getFilledInPixels(32));
            };

            $scope.handleMouseUp = function(e) {
                $scope.isDrawing = false;
            };

            $scope.handleScratchEnd = function() {
                //Removing foreground
                $scope.canvas.parentNode.removeChild($scope.canvas);

                //Showing popup
                $scope.mypopup = $scope.is_win ? $scope.card.popups.win : $scope.card.popups.lose;
                $scope.show_desc = $scope.mypopup.description ? true : false;
                var popup_image_url = Url.get("/scratchcard/mobile_view/getimage", {"image": $scope.mypopup.image, "value_id": $scope.valueId});

                var template = '<div class="list card">';

                template += '   <div class="item item-image' + (popup_image_url ? '' : ' ng-hide') + '">' +
                            '       <img src="' + (popup_image_url) + '">' +
                            '   </div>';

                if($scope.show_desc) {
                    template += '   <div class="item item-custom item-text-wrap">' +
                    '       <h2>' + $scope.mypopup.description + '</h2>' +
                    '   </div>';
                }

                if($scope.points_earned) {
                    template += '<div class="item item-custom congratz"><span><i class="ion-ios-star"></i> ' + $scope.points_earned + '</span> ' + $translate.instant("points") + '</div>';
                }

                template += '</div>';

                var dialog_data = {
                    title: $scope.mypopup.title,
                    template: template
                };

                $ionicPopup.alert(dialog_data).then(function () {
                    $scope.endScratch();
                });

            };

            $scope.getRandomPoints = function (min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min +1)) + min;
            };

            $scope.isDrawing = false;
            $scope.lastPoint = null;
            $scope.attempt_is_logged = false;

            $scope.card_width = $scope.card.is_portrait == "1" ? 300 : 400;
            $scope.card_height = $scope.card.is_portrait == "1" ? 400 : 300;

            $scope.container    = $document[0].getElementById('scratch-container');
            $scope.canvas       = $document[0].getElementById('scratch-canvas');
            $scope.image_is_loaded = false;

            $scope.canvasWidth  = $scope.canvas.width;
            $scope.canvasHeight = $scope.canvas.height;

            $scope.ctx          = $scope.canvas.getContext('2d');
            $scope.image        = new Image();
            $scope.brush        = new Image();

            $scope.image.crossOrigin = '';
            $scope.image.src = Url.get("/scratchcard/mobile_view/getimage", {"image": $scope.card.image_foreground, "value_id": $scope.valueId});

            //Test if we won or not
            $scope.lucky_token = Math.floor(Math.random() * 99) + 1;
            $scope.is_win = $scope.lucky_token <= $scope.card.win_percentage ? true : false;

            //If we won, we compute the number of points the user won
            if($scope.card.is_point > 0 && $scope.is_win) {
                $scope.points_earned = $scope.getRandomPoints($scope.card.min_points, $scope.card.max_points);
            } else {
                $scope.points_earned = null;
            }

            $scope.background_image = $scope.is_win ? $scope.card.image_win : $scope.card.image_lose;

            $scope.background_image = Url.get("/scratchcard/mobile_view/getimage", {"image": $scope.background_image, "value_id": $scope.valueId});

            $scope.image.onload = function() {
                $scope.ctx.drawImage($scope.image, 0, 0);

                $timeout(function() {
                    $scope.image_is_loaded = true;
                });
            };

            $scope.brush.src = 'data:image/png;base64,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';

            $scope.canvas.addEventListener('mousedown', $scope.handleMouseDown, false);
            $scope.canvas.addEventListener('touchstart', $scope.handleMouseDown, false);
            $scope.canvas.addEventListener('mousemove', $scope.handleMouseMove, false);
            $scope.canvas.addEventListener('touchmove', $scope.handleMouseMove, false);
            $scope.canvas.addEventListener('mouseup', $scope.handleMouseUp, false);
            $scope.canvas.addEventListener('touchend', $scope.handleMouseUp, false);
        }
    };
})