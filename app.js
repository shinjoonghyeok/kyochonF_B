(function() {
  app.register.controller('datalogMainAppController', datalogMainAppController);
  function datalogMainAppController($scope, $location, $rootScope, $window, $filter, $state, $element, socket, serviceSession, serviceNotification, serviceAuth, serviceLogdb, USER_LEVELS, $interval) {
    $scope.logoName = "KYOCHON"
    $scope.uid = serviceSession.whoAmI();
    serviceSession.getCurrentUser()
    .success(function(m) {
      console.log("m", m);
      $scope.userRole = m.body.user.ext.admin.role.name;
      console.log($scope.userRole);

      if($scope.userRole=="member" && m.body.user.ext.admin.password_expire_time!= null) {
        swal("암호 만료 기간이 " + m.body.user.ext.admin.password_expire_time + "일 남았습니다.")
      }
      $scope.$apply();
    })

    console.log($scope.uid)

    $state.go("pos");
  }

  app.config(function($mdDateLocaleProvider) {
    $mdDateLocaleProvider.formatDate = function(date) {
      var m = moment(date);
      //console.log("m", m);
      return moment(date).format('YYYY-MM-DD');
    };
  });

  app.config(function ($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

  });

  app.register.directive("draggable", function() {
    return {
      restrict: 'A',
      scope: {
        fullobj: '=',
        tasklist: "=",
        draggable: '@',
        ind: '@'
      },
      link: function(scope, element, attributes) {
        //console.log(element[0]);
        var el = element[0];

        el.addEventListener('dragend', handleDragEnd, false);
        el.addEventListener('dragleave', handleDragLeave, false);
        el.addEventListener('drop', handleDrop, false);

        function handleDragEnd(e) {
          scope.$parent.basket.push(scope.fullobj)
          scope.tasklist[scope.ind].drag = true;
          scope.$apply();
          //console.log("Click on Remove to Remove")
          //alert("Click on Remove to Remove");
        }

        function handleDragLeave(e) {
          console.log(e);
        }

        function handleDrop(e) {
          this.classList.remove('dragover');
        }
      }
    }
  });

  app.register.directive('validateDateFormat', function($q, socket) {
  	return {
  		require: 'ngModel',
  		link: function(scope, el, attr, ctrl) {
  			var ngModelController = ctrl;
  			ngModelController.$asyncValidators.validDateFormat = function(modelValue, viewValue) {
  				var deferred = $q.defer();
  				if(modelValue != null) {
  					socket.send('com.logpresso.core.msgbus.RegexTesterPlugin.isValidDateFormat', {
  						'format': modelValue
  					}, LOGPRESSO.process.getPid())
  					.success(function(m) {
              console.log("m",m);
  						if(m.body.result) {
  							deferred.resolve(true);
  						} else {
  							deferred.reject();
  						}
  					})
  					.failed(function(m, raw) {
  						deferred.reject();
  					});
  				} else {
  					deferred.resolve(true);
  				}
  				return deferred.promise;
  			}
  		}
  	}
  });


  app.register.directive('answerExportesxxxx', function(socket, serviceLogdb) {
  	return {
  		restrict: 'E',
  		scope: {
  		},
  		//templateUrl: '/script/directive/directive.logdb.export.html',
      templateUrl: '/apps/datalog-kyochon/datalog-kyochon/download.html',
  		controller: function($scope, $element, $translate, serviceTranslate) {
  			$scope.locale = $translate.use();
  			$scope.optEncoding = [
  				{
  					"locale": $scope.locale,
  					"name": "UTF-8",
  					"charset": "UTF-8",
  					"default": "en"
  				},
  				{
  					"locale": $scope.locale,
  					"name": "UTF-16",
  					"charset": "UTF-16"
  				},
  				{
  					"locale": "ko",
  					"name": serviceTranslate('$S_str_EUCKR'),
  					"charset":"MS949",
  					"default": "ko"
  				},
  				{
  					"locale": "en",
  					"name": "Latin 1",
  					"charset":"Cp1252"
  				},
  				{
  					"locale": "zh",
  					"name": "Simplified Chinese",
  					"charset":"GB18030",
  					"default": "zh"
  				},
  				{
  					"locale": "jp",
  					"name": "Shift-JIS",
  					"charset":"SJIS",
  					"default": "jp"
  				}
  			];

  			function setDefaultEncoding(l) {
  				var def = $scope.optEncoding.filter(function(enc) {
  					return enc.default == l;
  				}).first();

  				console.log(def)
  				if(def == null) {
  					return $scope.optEncoding[0];
  				}
  				else {
  					return def;
  				}
  			}

  			$scope.extension = 'csv';
  			$scope.encoding = setDefaultEncoding($scope.locale);
  			$scope.filename = '';
  			$scope.from = 1;
  			$scope.to = 1;
  			$scope.id = -1;
  			$scope.isOnSubmit = false;
  			$scope.isOnDown = false;
  			$scope.isValidateRange = true;
  			$scope.cols = [];
  			$scope.addedColumnName = '';
  			$scope.selectedCols = [];
  			$scope.checkAll = true;
  			$scope.searchColName = '';
  			$scope.isColumnLoaded = false;
  			$scope.sortableOptions = {
  				distance: 5,
  				'ui-floating': true
  			};

  			var closeFn = function() {}

  			$scope.close = function() {
  				closeFn();
  				$scope.isOnSubmit = false;
  				$scope.isColumnLoaded = false;
  			}

  			$scope.addColumn = function() {
  				if($scope.addedColumnName != '') {
  					var p = {
  						"name": $scope.addedColumnName,
  						"is_checked": true,
  					};
  					$scope.cols.push(p);
  					$scope.addedColumnName = '';
  				}
  			}

  			$scope.changeColName = function() {
  				if($scope.searchColName == '') {
  					$scope.sortableOptions = { disabled: false };
  				}
  				else {
  					$scope.sortableOptions = { disabled: true };
  				}
  			}

  			$scope.changeMasterCheckBox = function(is_checked) {
  				if(!is_checked)
  					$scope.checkAll = false;
  			}

  			$scope.changeEncodingForFileType = function(type) {
  				if(type == 'csv') {
  					$scope.encoding = setDefaultEncoding($scope.locale);
  				} else if(type == 'html') {
  					$scope.encoding = $scope.optEncoding[0];
  				} else if(type == 'xml') {
  					$scope.encoding = $scope.optEncoding[0];
  				} else if(type == 'docx') {
  					$scope.encoding = $scope.optEncoding[0];
  				} else if(type == 'json') {
  					$scope.encoding = $scope.optEncoding[0];
  				}
  			}

  			$scope.validDownlodFile = function() {
  				$scope.selectedCols = [];

  				angular.forEach($scope.cols, function(col) {
  					if(col.is_checked) {
  						$scope.selectedCols.push(col.name);
  					}
  				});

  				$scope.isOnDown = true;

  				if($scope.selectedCols.length == 0 || $scope.downloadFrm.$invalid || $scope.from > $scope.to) {
  					$scope.isOnSubmit = true;
  					$scope.isOnDown = false;
  				}else {
  					$scope.download();
  				}
  			};

  			$scope.download = function () {
  				if($scope.filename.indexOf(" ") > -1) {
  					$scope.downloadFrm.name.$error.pattern = true;
  					$scope.isOnDown = false;
  					return;
  				}
  				var json = {
  					'filename': $scope.filename + '.' + $scope.extension,
  					'filetype': $scope.extension,
  					'offset': parseInt($scope.from) - 1,
  					'limit': parseInt($scope.to) - (parseInt($scope.from) - 1),
  					'query_id': $scope.id,
  					'charset': $scope.encoding.charset,
  					'fields': $scope.selectedCols
  				}
  				console.log('download parameter?', json);
  				socket.send("com.logpresso.core.msgbus.DbPlugin.prepareQueryResultDownload", json, 981024)
  				.success(function (m) {
  					var token = m.body.token;
  					var port = !!location._testPort_ ? location._testPort_ : location.port;
  					var downloadurl = location.protocol + '//' + location.hostname + ':' + port + '/downloader?token=' + token + '&force_download=true';

  					// 굳이 iframe으로 띄우는 이유는, 그냥 url 이동을 하면, unload 이벤트 때문에 쿼리가 삭제되기 때문임...
  					$('iframe#ifm-download').attr('src', downloadurl);
  					$scope.isOnDown = false;
  					$scope.isOnSubmit = false;
  					$scope.isColumnLoaded = false;
  					closeFn();
  				})
  				.failed(function() {
  					$scope.isOnDown = false;
  					throw new TypeError('cannot download');
  				});
  			}

  			$scope.preventSpace = function(e) {
  				if (e.keyCode === 32) e.preventDefault();
  			};

  			$element[0].addCloseEvent = function(fn) {
  				closeFn = fn;
  			}

  			$element[0].setConfig = function(config) {
  				if(!!config.extension) $scope.extension = config.extension;
  				if(!!config.filename) $scope.filename = config.filename;
  			}

  			$element[0].setId = function(id, count) {
  				console.log(id);
  				$scope.extension = 'csv';
  				$scope.filename = '';
  				$scope.from = 1;
  				$scope.encoding = setDefaultEncoding($scope.locale);
  				$scope.id = id;
  				$scope.to = count;
  			}

  			$element[0].init = function() {
  				$scope.cols = [];
  				$scope.selectedCols = [];

  				$scope.isOnSubmit = false;
  				$scope.isColumnLoaded = false;
  				$scope.checkAll = true;
  			}

  			$element[0].setCols = function(cols, fieldOrder) {
  				if (fieldOrder) {
  					cols.sort(function(a, b) {
  						if(fieldOrder.indexOf(a) == -1 && fieldOrder.indexOf(b) != -1) {
  							return 1;
  						}
  						if(fieldOrder.indexOf(a) != -1 && fieldOrder.indexOf(b) == -1) {
  							return -1;
  						}
  						if(fieldOrder.indexOf(a) == -1 && fieldOrder.indexOf(b) == -1) {
  							if(a > b) {
  								return 1;
  							}
  							if(b < a) {
  								return -1;
  							}
  							return 0;
  						}
  						if(fieldOrder.indexOf(a) > fieldOrder.indexOf(b)) {
  							return 1;
  						}
  						if(fieldOrder.indexOf(a) < fieldOrder.indexOf(b)) {
  							return -1;
  						}
  						return 0;
  					});
  				}
  				else {
  					_utility.sortColumns(cols);
  				}

  				for(var i = 0; i < cols.length; i++) {
  					var p = {
  						"name": cols[i],
  						"is_checked": true,
  					};
  					$scope.cols.push(p);
  				}

  				$scope.isColumnLoaded = true;
  				$scope.$apply();
  			}

  		},
  		link: function(scope, element, attrs) {
  		}
  	}
  });

  app.register.directive('answerExportes', function(socket, serviceLogdb) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/apps/datalog-kyochon/datalog-kyochon/download.html',
      controller: function($scope, $element, $translate, $attrs) {
        $scope.locale = $translate.use();
        $scope.optEncoding = [{
          "locale": "ko",
          "name": "EUC-KR",
          "charset": "MS949"
        }];
        $scope.extension = 'csv';
        $scope.encoding = $scope.optEncoding[0];
        $scope.filename = '';
        $scope.from = 1;
        $scope.to = 1;
        $scope.id = -1;
        $scope.isOnSubmit = false;
        $scope.isOnDown = false;
        $scope.title = "쿼리 결과";
        $scope.isValidateRange = true;
  			$scope.cols = [];
  			$scope.addedColumnName = '';
  			$scope.selectedCols = [];
  			$scope.checkAll = true;
  			$scope.searchColName = '';
  			$scope.isColumnLoaded = false;
  			$scope.sortableOptions = {
  				distance: 5,
  				'ui-floating': true
  			};

        if (!!$attrs.title) {
          $scope.title = $attrs.title;
        }

        var closeFn = function() {}

        $scope.close = function() {
          closeFn();
          $scope.isOnSubmit = false;
          $scope.isColumnLoaded = false;
        }

        $scope.addColumn = function() {
  				if($scope.addedColumnName != '') {
  					var p = {
  						"name": $scope.addedColumnName,
  						"is_checked": true,
  					};
  					$scope.cols.push(p);
  					$scope.addedColumnName = '';
  				}
  			}

  			$scope.changeColName = function() {
  				if($scope.searchColName == '') {
  					$scope.sortableOptions = { disabled: false };
  				}
  				else {
  					$scope.sortableOptions = { disabled: true };
  				}
  			}

  			$scope.changeMasterCheckBox = function(is_checked) {
  				if(!is_checked)
  					$scope.checkAll = false;
  			}

  			$scope.changeEncodingForFileType = function(type) {
  				if(type == 'csv') {
  					$scope.encoding = $scope.optEncoding[0];
  				} else if(type == 'html') {
  					$scope.encoding = $scope.optEncoding[0];
  				} else if(type == 'xml') {
  					$scope.encoding = $scope.optEncoding[0];
  				} else if(type == 'docx') {
  					$scope.encoding = $scope.optEncoding[0];
  				} else if(type == 'json') {
  					$scope.encoding = $scope.optEncoding[0];
  				}
  			}

        $scope.validDownlodFile = function() {
          $scope.selectedCols = [];

  				angular.forEach($scope.cols, function(col) {
  					if(col.is_checked) {
  						$scope.selectedCols.push(col.name);
  					}
  				});

          $scope.isOnDown = true;

          if($scope.selectedCols.length == 0 || $scope.downloadFrm.$invalid || $scope.from > $scope.to) {
            $scope.isOnSubmit = true;
            $scope.isOnDown = false;
          } else {
            $scope.download();
          }
        };

        $scope.download = function() {
          if ($scope.filename.indexOf(" ") > -1) {
            $scope.downloadFrm.name.$error.pattern = true;
            $scope.isOnDown = false;
            return;
          }
          var json = {
            'filename': $scope.filename + '.' + $scope.extension,
            'filetype': $scope.extension,
            'offset': parseInt($scope.from) - 1,
            'limit': parseInt($scope.to) - (parseInt($scope.from) - 1),
            'query_id': $scope.id,
            'charset': $scope.encoding.charset,
            'fields': $scope.selectedCols
          };
          console.log('download parameter?', json);
          socket.send("com.logpresso.core.msgbus.DbPlugin.prepareQueryResultDownload", json, 981024)
            .success(function(m) {
              var token = m.body.token;
              var port = !!location._testPort_ ? location._testPort_ : location.port;
              var downloadurl = location.protocol + '//' + location.hostname + ':' + port + '/downloader?token=' + token + '&force_download=true';
              // 굳이 iframe으로 띄우는 이유는, 그냥 url 이동을 하면, unload 이벤트 때문에 쿼리가 삭제되기 때문임...
              $(top.document).find('iframe#ifm-download').attr('src', downloadurl);
              $scope.isOnDown = false;
              $scope.isOnSubmit = false;
              $scope.isColumnLoaded = false;
              closeFn();
            })
            .failed(function(m, raw) {
              $scope.isOnDown = false;
              //msgbusFailedString('쿼리 결과를 받아올 수 없습니다.')(m, raw);
            });
        }

        $scope.preventSpace = function(e) {
          if (e.keyCode === 32) e.preventDefault();
        };

        $element[0].addCloseEvent = function(fn) {
          closeFn = fn;
        }

        $element[0].setConfig = function(config) {
          if (!!config.extension) $scope.extension = config.extension;
          if (!!config.filename) $scope.filename = config.filename;
        }

        $element[0].setId = function(id, count) {
          $scope.extension = 'csv';
          $scope.filename = '';
          $scope.from = 1;
          $scope.encoding = $scope.optEncoding[0];
          $scope.id = id;
          $scope.to = count;
        }

        $element[0].init = function() {
  				$scope.cols = [];
  				$scope.selectedCols = [];

  				$scope.isOnSubmit = false;
  				$scope.isColumnLoaded = false;
  				$scope.checkAll = true;
  			}

  			$element[0].setCols = function(cols, fieldOrder) {
  				if (fieldOrder) {
  					cols.sort(function(a, b) {
  						if(fieldOrder.indexOf(a) == -1 && fieldOrder.indexOf(b) != -1) {
  							return 1;
  						}
  						if(fieldOrder.indexOf(a) != -1 && fieldOrder.indexOf(b) == -1) {
  							return -1;
  						}
  						if(fieldOrder.indexOf(a) == -1 && fieldOrder.indexOf(b) == -1) {
  							if(a > b) {
  								return 1;
  							}
  							if(b < a) {
  								return -1;
  							}
  							return 0;
  						}
  						if(fieldOrder.indexOf(a) > fieldOrder.indexOf(b)) {
  							return 1;
  						}
  						if(fieldOrder.indexOf(a) < fieldOrder.indexOf(b)) {
  							return -1;
  						}
  						return 0;
  					});
  				}
  				else {
  					_utility.sortColumns(cols);
  				}

  				for(var i = 0; i < cols.length; i++) {
  					var p = {
  						"name": cols[i],
  						"is_checked": true,
  					};
  					$scope.cols.push(p);
  				}

  				$scope.isColumnLoaded = true;
  				$scope.$apply();
  			}
      },
      link: function(scope, element, attrs) {}
    }
  });


})();

//# sourceURL=apps/datalog-kyochon/datalog-kyochon/app.js
