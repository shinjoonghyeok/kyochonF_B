(function() {
  app.register.controller('DatalogTestController', DatalogTestController);

  function DatalogTestController($scope, $q, $location, $http, socket, $filter, $state, $element, $window, $document, serviceLogdb, $stateParams, serviceSession, serviceAuth, USER_LEVELS, $interval, $timeout, $templateCache, filterFilter, serviceNotification, serviceLogdbManagement) {
    console.log(":: POS Page ::");


    $(function() {
      $('#startDatePicker,#endDatePicker').datetimepicker({
        sideBySide: true,
        format: 'YYYY-MM-DD',
        locale: 'ko'
      });

      $('#startTimePicker,#endTimePicker').datetimepicker({
        sideBySide: true,
        format: 'HH:mm:ss'
      });
    });
    $scope.resizeMode = "OverflowResizer";

    var queryMaxCounter = 3000;
    var lastQueryID = null;

    $scope.processTime = 0;

    $scope.btnFlag = "ready";
    $scope.searchSignValue = [
      "포함",
      "==",
      "!=",
      "null",
      "notnull",
      "(int)==",
      "(int)<=",
      "(int)>=",
    ];
    var logSearchInstance = null;
    var logSearchQuery;

    var downloadInstance = null;
    var downloadCount = 0;

    function makeSearchStrField(array, field) {
      var retStr = "";
      for(var i=0; i<array.length; i++) {
        retStr += field + " == \"" + array[i].key + "\" or "
      }
      retStr = retStr.substr(0, retStr.length-3);
      return retStr;
    }

    $scope.searchLimit = 0;
    $scope.searchPage = 100;
    $scope.logSearchPaginationArray = [];

    $scope.tableOrder = "SALE1000";
    $scope.tableMenu = "SALE1100";
    $scope.tableSale = "SALE1200";

    $scope.tableFranchise = "KCFranchise";
    $scope.tableLogistics = "KCBranch";
    $scope.tablePOSGroup = "KCPOSGroup";
    $scope.tableOrderPath = "KCOrderPath";
    $scope.tableMenuItem = "KCMenu";
    $scope.tableChickenCount = "KCChickenCount";
    $scope.tableFranchiseSize = "KCFranchiseSize";
    $scope.tablePayMethod = "KCPayMethod";

    $scope.lookupFranchise = "KCFranchise";
    $scope.lookupBranch = "KCBranch";
    $scope.lookupPOSGroup = "KCPOSGroup";
    $scope.lookupOrderPath = "KCOrderPath";
    $scope.lookupMenuItem = "KCMenu";
    $scope.lookupChickenCount = "KCChickenCount";
    $scope.lookupFranchiseSize = "KCFranchiseSize";
    $scope.lookupPayMethod = "KCPayMethod";

    /* ---------------------------------------------------------------------------------------------------------------------
    * Pagination Set Start
    * ---------------------------------------------------------------------------------------------------------------------*/
    $scope.logSearchPageSize = $scope.searchPage;
    $scope.logSearchTotalCount = 0;
    $scope.logSearchPagerPageSize = 10;
    $scope.logSearchCurrentStart = 1;
    $scope.logSearchCurrentPage = 1;
    $scope.logSearchJumpNumber = 1;

    function makeLogSearchPaginationInfo() {
      $scope.logSearchPaginationArray = [];
      var arrayCount = 0;

      if ($scope.logSearchTotalCount > 0)
        $scope.logSearchPaginationCount = Math.ceil($scope.logSearchTotalCount / $scope.logSearchPageSize);
      else
        $scope.logSearchPaginationCount = 1;

      var showPageNumber = 0;

      if ($scope.logSearchPaginationCount > $scope.logSearchPagerPageSize) arrayCount = $scope.logSearchPagerPageSize;
      else arrayCount = $scope.logSearchPaginationCount;

      for (var i = 0; i < arrayCount; i++) {
        $scope.logSearchShowPage = $scope.logSearchCurrentStart + i;
        if ($scope.logSearchPaginationCount >= $scope.logSearchShowPage)
          $scope.logSearchPaginationArray.push($scope.logSearchShowPage);
        else break;
      }
    }

    $scope.logSearchPageChanged = function(number) {
      var idx = number - 1;
      $scope.logSearchCurrentPage = number;
      $scope.logSearchCurrentStart = (Math.ceil($scope.logSearchCurrentPage / $scope.logSearchPagerPageSize) - 1) * $scope.logSearchPagerPageSize + 1;

      logSearchInstance.getResult(idx * $scope.logSearchPageSize, $scope.logSearchPageSize, function(message) {
        var fieldTypeArray = new Array();
        var fieldOrderArray = new Array();
        var tempArray = new Array();
        $scope.logSearchFields = new Array();

        for (var key in message.body.field_types) {
          if (tempArray.findIndex(obj => obj.key == key) === -1) tempArray.push({"key":key,"val":message.body.field_types[key]});
          if(key!="_table") fieldTypeArray.push(key);
          if(key=="_id" || key=="_time") fieldOrderArray.push(key);
        }
        fieldTypeArray.sort();
        if(typeof message.body.field_order != "undefined") {
          for(var i=0; i<message.body.field_order.length; i++) {
            if(message.body.field_order[i]!="_id" && message.body.field_order[i]!="_time" && message.body.field_order[i]!="_table") fieldOrderArray.push(message.body.field_order[i]);
          }
        }

        var diffArray = array_diff(fieldTypeArray,fieldOrderArray);
        var finalArray = union(fieldOrderArray,diffArray);


        for(var i=0;i<finalArray.length; i++) {
          var fieldData = tempArray.find(obj => obj.key === finalArray[i]);
          if(typeof fieldData !== "undefined") $scope.logSearchFields.push(fieldData);
        }

        $scope.tdWidth = $scope.tableWidth / $scope.logSearchFields.length;
        if($scope.tdWidth < 100) $scope.tdWidth = 100;
        $scope.logSearchResult = message.body.result;
        $scope.$apply()
      });
      makeLogSearchPaginationInfo();
    }

    $scope.logSearchJumpNext = function() {
      $scope.logSearchCurrentPage = $scope.logSearchCurrentPage + $scope.logSearchPagerPageSize;
      if ($scope.logSearchCurrentPage > $scope.logSearchPaginationCount) {
        $scope.logSearchCurrentPage = $scope.logSearchPaginationCount;
      }
      $scope.logSearchPageChanged($scope.logSearchCurrentPage);
    }

    $scope.logSearchPageNext = function() {
      $scope.logSearchCurrentPage = $scope.logSearchCurrentPage + 1;
      if ($scope.logSearchCurrentPage > $scope.logSearchPaginationCount) {
        $scope.logSearchCurrentPage = $scope.logSearchCurrentPage - 1;
      } else {
        $scope.logSearchPageChanged($scope.logSearchCurrentPage);
      }
    }

    $scope.logSearchJumpPrev = function() {
      $scope.logSearchCurrentPage = $scope.logSearchCurrentPage - $scope.logSearchPagerPageSize;
      if ($scope.logSearchCurrentPage < 1) {
        $scope.logSearchCurrentPage = 1;
      }
      $scope.logSearchPageChanged($scope.logSearchCurrentPage);
    }

    $scope.logSearchPagePrev = function() {
      $scope.logSearchCurrentPage = $scope.logSearchCurrentPage - 1;
      if ($scope.logSearchCurrentPage < 1) {
        $scope.logSearchCurrentPage = $scope.logSearchCurrentPage + 1;
      } else {
        $scope.logSearchPageChanged($scope.logSearchCurrentPage);
      }
    }
    /* ---------------------------------------------------------------------------------------------------------------------
    * Pagination Set End
    * ---------------------------------------------------------------------------------------------------------------------*/

    /***** Log Search Function **************************************************************************************************/
    function logSearchStart(m) {
      //console.log("Query Start", m);
      loading(true, "logSearchPanel");
    }

    function logSearchHead(helper) {
      helper.getResult(function(message) {
        //console.log("head", message, $scope.searchField);
        //$scope.logSearchFieldType = message.body.field_types;
        $scope.$apply();
      });
    }

    function logSearchChange(message) {
      //console.log("change", message, $scope.searchField);
      $scope.logSearchTotalCount = message.body.count;

      logSearchInstance.getResult(0, $scope.logSearchPageSize, function(message) {
        console.log("change", message);

        var fieldTypeArray = new Array();
        var fieldOrderArray = new Array();
        var tempArray = new Array();
        $scope.logSearchFields = new Array();

        for (var key in message.body.field_types) {
          if (tempArray.findIndex(obj => obj.key == key) === -1) tempArray.push({"key":key,"val":message.body.field_types[key]});
          if(key!="_table") fieldTypeArray.push(key);
          if(key=="_id" || key=="_time") fieldOrderArray.push(key);
        }
        fieldTypeArray.sort();
        if(typeof message.body.field_order != "undefined") {
          for(var i=0; i<message.body.field_order.length; i++) {
            if(message.body.field_order[i]!="_id" && message.body.field_order[i]!="_time" && message.body.field_order[i]!="_table") fieldOrderArray.push(message.body.field_order[i]);
          }
        }

        var diffArray = array_diff(fieldTypeArray,fieldOrderArray);
        var finalArray = union(fieldOrderArray,diffArray);


        for(var i=0;i<finalArray.length; i++) {
          var fieldData = tempArray.find(obj => obj.key === finalArray[i]);
          if(typeof fieldData !== "undefined") $scope.logSearchFields.push(fieldData);
        }

        $scope.tdWidth = $scope.tableWidth / $scope.logSearchFields.length;
        if($scope.tdWidth < 100) $scope.tdWidth = 100;
        $scope.logSearchResult = message.body.result;

        $timeout(function() {
          var reHeight = $(".card-search").offset().top + 1;
          var reWidth = $(window).width() - $(".card-table").width();
          divResize("card-search",reHeight, reWidth);
        },500);

        $scope.$apply()
      });

      makeLogSearchPaginationInfo();
      $scope.$apply();
    }

    function logSearchTail(helper) {
      helper.getResult(function(m) {
        logSearchInstance.getResult(0, $scope.logSearchPageSize, function(message) {
          var fieldTypeArray = new Array();
          var fieldOrderArray = new Array();
          var tempArray = new Array();
          $scope.logSearchFields = new Array();

          for (var key in message.body.field_types) {
            if (tempArray.findIndex(obj => obj.key == key) === -1) tempArray.push({"key":key,"val":message.body.field_types[key]});
            if(key!="_table") fieldTypeArray.push(key);
            if(key=="_id" || key=="_time") fieldOrderArray.push(key);
          }
          fieldTypeArray.sort();
          if(typeof message.body.field_order != "undefined") {
            for(var i=0; i<message.body.field_order.length; i++) {
              if(message.body.field_order[i]!="_id" && message.body.field_order[i]!="_time" && message.body.field_order[i]!="_table") fieldOrderArray.push(message.body.field_order[i]);
            }
          }

          var diffArray = array_diff(fieldTypeArray,fieldOrderArray);
          var finalArray = union(fieldOrderArray,diffArray);


          for(var i=0;i<finalArray.length; i++) {
            var fieldData = tempArray.find(obj => obj.key === finalArray[i]);
            if(typeof fieldData !== "undefined") $scope.logSearchFields.push(fieldData);
          }

          $scope.tdWidth = $scope.tableWidth / $scope.logSearchFields.length;
          if($scope.tdWidth < 100) $scope.tdWidth = 100;
          $scope.logSearchResult = message.body.result;

          $timeout(function() {
            var reHeight = $(".card-search").offset().top + 1;
            var reWidth = $(window).width() - $(".card-table").width();
            divResize("card-search",reHeight, reWidth);
          },500);

          $scope.$apply()
        });

        $scope.logSearchTotalCount = helper.message.body.total_count;

        downloadInstance = logSearchInstance.getId();
        downloadCount = helper.message.body.total_count;

        makeLogSearchPaginationInfo();
        $scope.$apply();
      });
    }

    function logSearchLoaded(m) {
      console.log("Query Loaded", m);
      endTimeStamp = new Date();
      $scope.processTime = msToTime(endTimeStamp - startTimeStamp);
      loading(false, "logSearchPanel");
      $scope.btnFlag = "ready";
      lastQueryID = m.body.id;
      //serviceLogdb.remove(logSearchInstance);
    }

    function logSearchFailed(raw, type, note) {
      alert(raw[0].errorCode);
      loading(false, "logSearchPanel");
      $scope.btnFlag = "ready";
    }
    /***** Log Search Function **************************************************************************************************/

    function getSearchString(sign,field, str) {
      var searchStr = "";
      switch (sign) {
        case "0":
          searchStr += field + "==" + "\"*" + str + "*\"";
          break;
        case "1":
          searchStr += field + "==" + "\"" + str + "\"";
          break;
        case "2":
          searchStr += field + "!=" + "\"" + str + "\"";
          break;
        case "3":
          searchStr += "isnull(" + field + ")";
          break;
        case "4":
          searchStr += "isnotnull(" + field + ")";
          break;
        case "5":
          searchStr += field + "==" + str;
          break;
        case "6":
          searchStr += field + "<=" + str;
          break;
        case "7":
          searchStr += field + ">=" + str;
          break;
        case "8":
          searchStr += field + "==ip(\"" + str + "\")";
          break;
        case "9":
          searchStr += field + "<=ip(\"" + str + "\")";
          break;
        case "10":
          searchStr += field + ">=ip(\"" + str + "\")";
          break;
        default:
          searchStr = "";
          break;
      }

      return searchStr;
    }

    var startTimeStamp = "";
    var endTimeStamp = "";

    $scope.searchTotalLog = function() {
      $scope.processTime = 0;

      startTimeStamp = new Date();
      $scope.tableWidth = $("#mainTable").width();

      if(logSearchInstance!=null) {
        console.log("already log exist query")
        serviceLogdb.remove(logSearchInstance);
      }
      if(tempReSearchInstance!=null) {
        console.log("already log exist query ", counter)
        serviceLogdb.remove(tempReSearchInstance);
      }

      var fianlQuery = "";
      var statsQuery = "";

      var querySB = new StringBuilder();
      var statSB = new StringBuilder();

      var searchStartDate = "";
      var searchEndDate = "";
      var searchFromStr = "";
      var searchToStr = "";


      //querySB.AppendFormat(" table {0} {1} {2}", searchFromStr, searchToStr, $scope.tableOrder);
      querySB.AppendFormat(" table {0}",  $scope.tableOrder);
      fianlQuery = querySB.ToString();

      if($scope.$parent.uid=="root" || $scope.$parent.uid=="logpresso") {
        console.log("Run Query : " + fianlQuery);
      }

      $scope.logSearchFields = [];
      $scope.logSearchResult = [];
      $scope.btnFlag = "searching";

      logSearchInstance = serviceLogdb.create(pid);
      $scope.logSearchPageSize = $scope.searchPage;
      logSearchQuery = logSearchInstance.query(fianlQuery, $scope.searchPage);

      try {
        logSearchQuery
          .started(logSearchStart)
          .onHead(logSearchHead)
          .onStatusChange(logSearchChange)
          .onTail(logSearchTail)
          .loaded(logSearchLoaded)
          .failed(logSearchFailed);

        serviceLogdb.remove(logSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    $scope.searchStop = function() {
      logSearchInstance.stop();

      loading(false, "logSearchPanel");
      $scope.btnFlag = "ready";
    }

    $scope.selectFieldClass = function(val) {
      var className = "";
      switch(val) {
        case "string":
          className = "fa fa-font"
        break;

        case "int":
        case "long":
        case "double":
          className = "answer_field_number";
        break;

        case "date":
          className = "fa fa-calendar";
        break;

        case "ipv4":
        case "ipv6":
          className = "fa fa-sitemap";
        break;

        case "list":
          className = "fa fa-align-justify";
        break;

        case "map":
          className = "fa fa-th-list";
        break;

        default:
          className = "fa fa-font";
        break;
      }

      return className;
    }

    function makeExcelData(tableArray) {
      console.log(tableArray)
			var retArray = new Array();

			for(var i=0; i<tableArray.result.length; i++) {
				var retObj = new Object();
				for( var j=0; j<tableArray.field.length; j++) {
					//var objName = tableArray.field[j].key;
          var objName = tableArray.field[j];
					retObj[objName] = tableArray.result[i][objName];
				}
				retArray.push(retObj);
			}
			return retArray;
		}

    $scope.saveReportExcel = function() {
			var wb = XLSX.utils.book_new();

      var logSearchExcel = new Object();
      logSearchExcel.field = $scope.statSearchField;
      logSearchExcel.result = $scope.statSearchResult;

			var inputStatData = makeExcelData(logSearchExcel);

			var statData = XLSX.utils.json_to_sheet(inputStatData);

			XLSX.utils.book_append_sheet(wb, statData, "POS 통계");
			var wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});

			/* generate a download */
			function s2ab(s) {
				var buf = new ArrayBuffer(s.length);
				var view = new Uint8Array(buf);
				for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
			}

			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "POS Report.xlsx");
		}


    $scope.logSearchDownload = function() {
      if (downloadInstance != "" && downloadCount != 0) {
        $('.answer-download').modal();

        $('.answer-download answer-exportes')[0].setId(downloadInstance, downloadCount);
        $('.answer-download answer-exportes')[0].init();
    		socket.send('com.logpresso.core.msgbus.DbPlugin.getFields', { 'query_id':downloadInstance }, pid)
    		.success(function(m) {
    			$('.answer-download answer-exportes')[0].setCols(m.body.fields, m.body.field_order);
    		})
    		.failed(function(m, raw) {
    			console.log(m, raw);
    		})

        $('.answer-download answer-exportes')[0].addCloseEvent(function() {
          $(".answer-download").modal('hide');
        });
      }
    }

    var reHeight = $(".card-search").offset().top + 18;
    var reWidth = $(window).width() - $(".card-table").width();
    divResize("card-search",reHeight, reWidth);

    $scope.$on('$destroy', function() {
      console.log("Search Page Destroy");
      if(logSearchInstance!=null) {
        console.log("already log exist query")
        serviceLogdb.remove(logSearchInstance);
      }
      if(downloadInstance!=null) {
        console.log("already download exist query")
        serviceLogdb.remove(downloadInstance);
      }
    });

    $(function() {
      $(window).resize(function() {
        console.log("resize");
        var reHeight = $(".card-search").offset().top + 1;
        var reWidth = $(window).width() - $(".card-table").width();
        divResize("card-search",reHeight, reWidth);
      });
    });
    window.addEventListener('resize', function() {
      console.log("resize browser");
      var reHeight = $(".card-search").offset().top + 1;
      var reWidth = $(window).width() - $(".card-table").width();
      divResize("card-search",reHeight, reWidth);
    }, true);

    $scope.reSearchInfo = new Array();
    $scope.reSearchMax = 2;

    $scope.reSearchTargetField = "";
    $scope.reSearchTargetValue = "";

    $scope.reSearchResult = new Array();

    var reSearchInstance = new Array();
    var reSearchQuery = new Array();

    var tempReSearchInstance = null;
    var tempReSearchQuery;

    $scope.reSearchPageSize = new Array();
    $scope.reSearchTotalCount = new Array();
    $scope.reSearchPagerPageSize = new Array();
    $scope.reSearchCurrentStart = new Array();
    $scope.reSearchCurrentPage = new Array();
    $scope.reSearchJumpNumber = new Array();

    $scope.reSearchPaginationArray = new Array();
    $scope.reSearchPaginationCount = new Array();
    $scope.reSearchShowPage = new Array();
    $scope.reSearchFields= new Array();

    for(var i=0; i<$scope.reSearchMax; i++) {
      reSearchInstance[i] = null;
      reSearchQuery[i] = null;

      $scope.reSearchPageSize[i] = $scope.searchPage;
      $scope.reSearchTotalCount[i] = 0;
      $scope.reSearchPagerPageSize[i] = 10;
      $scope.reSearchCurrentStart[i] = 1;
      $scope.reSearchCurrentPage[i] = 1;
      $scope.reSearchJumpNumber[i] = 1;
    }



    $scope.showQueryResult = function(type) {
      $scope.showInfo = type;
    }
    $scope.showInfo = "basic";

    $scope.reSearchAction = function() {
      if(lastQueryID==null) {
        swal("Search First");
        return;
      }
      if($scope.reSearchInfo.length > $scope.reSearchMax) {
        swal("Over Flow");
        return;
      }
      if($scope.reSearchInfo.length==0) {
        $scope.reSearchTargetField = "cBigo"
        $scope.reSearchTargetValue = "카드";
      }
      else if($scope.reSearchInfo.length==1) {
        $scope.reSearchTargetField = "cMemAddr1"
        $scope.reSearchTargetValue = "북정동";
      }
      else {
        $scope.reSearchTargetField = "cType"
        $scope.reSearchTargetValue = "배달";
      }

      var reSearchInfoObj = new Object();
      reSearchInfoObj.field = $scope.reSearchTargetField;
      reSearchInfoObj.value = $scope.reSearchTargetValue;
      $scope.reSearchInfo.push(reSearchInfoObj);
      reSearchSubmit($scope.reSearchInfo.length -1);

      $scope.showInfo = $scope.reSearchInfo.length -1;
    }

    function reSearchSubmit(counter) {
      loading(true, "logSearchPanel");
      console.log(lastQueryID, counter)
      // reSearchInstance[counter] = null;
      // reSearchQuery[counter] = null;

      if(reSearchInstance[counter]!=null) {
        console.log("already log exist query ", counter)
        serviceLogdb.remove(reSearchInstance[counter]);
      }

      var reSearchQuery = "";
      var reQuerySB = new StringBuilder();
      reQuerySB.AppendFormat(" result {0}",  lastQueryID);
      reQuerySB.AppendFormat(" | search {0} == \"*{1}*\"", $scope.reSearchInfo[counter].field, $scope.reSearchInfo[counter].value);

      reSearchQuery = reQuerySB.ToString();
      console.log("ReQuery", reSearchQuery);

      tempReSearchInstance = serviceLogdb.create(pid);
      tempReSearchQuery = tempReSearchInstance.query(reSearchQuery, $scope.searchPage);
      try {
        tempReSearchQuery
          .started(function(m) {
            console.log("re start",m)
          })
          .onHead(function(helper) {
            helper.getResult(function(message) {
              console.log("re head", message);
              $scope.$apply();
            });
          })
          .onStatusChange(function(message) {
            console.log("re change", message);
            $scope.reSearchTotalCount[counter] = message.body.count;
            reSearchInstance[counter] = tempReSearchInstance;

            reSearchInstance[counter].getResult(0, $scope.reSearchPageSize[counter], function(message) {
              console.log("change", message);

              var fieldTypeArray = new Array();
              var fieldOrderArray = new Array();
              var tempArray = new Array();
              $scope.reSearchFields[counter] = new Array();

              for (var key in message.body.field_types) {
                if (tempArray.findIndex(obj => obj.key == key) === -1) tempArray.push({"key":key,"val":message.body.field_types[key]});
                if(key!="_table") fieldTypeArray.push(key);
                if(key=="_id" || key=="_time") fieldOrderArray.push(key);
              }
              fieldTypeArray.sort();
              if(typeof message.body.field_order != "undefined") {
                for(var i=0; i<message.body.field_order.length; i++) {
                  if(message.body.field_order[i]!="_id" && message.body.field_order[i]!="_time" && message.body.field_order[i]!="_table") fieldOrderArray.push(message.body.field_order[i]);
                }
              }

              var diffArray = array_diff(fieldTypeArray,fieldOrderArray);
              var finalArray = union(fieldOrderArray,diffArray);


              for(var i=0;i<finalArray.length; i++) {
                var fieldData = tempArray.find(obj => obj.key === finalArray[i]);
                if(typeof fieldData !== "undefined") $scope.reSearchFields[counter].push(fieldData);
              }

              $scope.tdWidth = $scope.tableWidth / $scope.reSearchFields[counter].length;
              if($scope.tdWidth < 100) $scope.tdWidth = 100;
              $scope.reSearchInfo[counter].result = message.body.result;

              $timeout(function() {
                var reHeight = $($(".card-research")[counter]).offset().top + 1;
                var reWidth = $(window).width() - $(".card-table").width();
                divResizeArray("card-research",reHeight, reWidth, counter);
              },500);

              $scope.$apply()
            });

            makeReSearchPaginationInfo(counter);
            $scope.$apply();
          })
          .onTail(function(helper) {
            helper.getResult(function(message) {
              console.log("re tail", message);
              reSearchInstance[counter] = tempReSearchInstance
              reSearchInstance[counter].getResult(0, $scope.reSearchPageSize[counter], function(message) {
              var fieldTypeArray = new Array();
              var fieldOrderArray = new Array();
              var tempArray = new Array();
              $scope.reSearchFields[counter] = new Array();

              for (var key in message.body.field_types) {
                if (tempArray.findIndex(obj => obj.key == key) === -1) tempArray.push({"key":key,"val":message.body.field_types[key]});
                if(key!="_table") fieldTypeArray.push(key);
                if(key=="_id" || key=="_time") fieldOrderArray.push(key);
              }
              fieldTypeArray.sort();
              if(typeof message.body.field_order != "undefined") {
                for(var i=0; i<message.body.field_order.length; i++) {
                  if(message.body.field_order[i]!="_id" && message.body.field_order[i]!="_time" && message.body.field_order[i]!="_table") fieldOrderArray.push(message.body.field_order[i]);
                }
              }

              var diffArray = array_diff(fieldTypeArray,fieldOrderArray);
              var finalArray = union(fieldOrderArray,diffArray);

              for(var i=0;i<finalArray.length; i++) {
                var fieldData = tempArray.find(obj => obj.key === finalArray[i]);
                if(typeof fieldData !== "undefined") $scope.reSearchFields[counter].push(fieldData);
              }

              $scope.tdWidth = $scope.tableWidth / $scope.logSearchFields.length;
              if($scope.tdWidth < 100) $scope.tdWidth = 100;
              $scope.reSearchInfo[counter].result = message.body.result;

              $timeout(function() {
                var reHeight = $($(".card-research")[counter]).offset().top + 1;
                var reWidth = $(window).width() - $(".card-table").width();
                divResizeArray("card-research",reHeight, reWidth, counter);
              },500);

              $scope.$apply()
            });

            $scope.reSearchTotalCount[counter] = helper.message.body.total_count;

            // downloadInstance = logSearchInstance.getId();
            // downloadCount = helper.message.body.total_count;

            makeReSearchPaginationInfo(counter);
            $scope.$apply();
            });
          })
          .loaded(function(m) {
            console.log("re load",m)
            loading(false, "logSearchPanel");
            lastQueryID = m.body.id;
          })
          .failed(function(raw, type, note) {
            console.log("re fail",raw, type, note)
          });

        serviceLogdb.remove(tempReSearchInstance);
      } catch (e) {
        console.log(e);
      }
      reSearchInstance[counter] = tempReSearchInstance
    }





    /* ---------------------------------------------------------------------------------------------------------------------
    * Pagination Set Start
    * ---------------------------------------------------------------------------------------------------------------------*/


    function makeReSearchPaginationInfo(counter) {
      $scope.reSearchPaginationArray[counter] = [];
      var arrayCount = 0;

      if ($scope.reSearchTotalCount[counter] > 0)
        $scope.reSearchPaginationCount[counter] = Math.ceil($scope.reSearchTotalCount[counter] / $scope.reSearchPageSize[counter]);
      else
        $scope.reSearchPaginationCount[counter] = 1;

      var showPageNumber = 0;

      if ($scope.reSearchPaginationCount[counter] > $scope.reSearchPagerPageSize[counter]) arrayCount = $scope.reSearchPagerPageSize[counter];
      else arrayCount = $scope.reSearchPaginationCount[counter];

      console.log("###", $scope.reSearchPaginationCount[counter], $scope.reSearchPagerPageSize[counter], $scope.reSearchCurrentStart[counter])

      for (var i = 0; i < arrayCount; i++) {
        $scope.reSearchShowPage[counter] = $scope.reSearchCurrentStart[counter] + i;
        if ($scope.reSearchPaginationCount[counter] >= $scope.reSearchShowPage[counter])
          $scope.reSearchPaginationArray[counter].push($scope.reSearchShowPage[counter]);
        else break;
      }
    }

    $scope.reSearchPageChanged = function(number, counter) {
      var idx = number - 1;
      $scope.reSearchCurrentPage[counter] = number;
      console.log("####", $scope.reSearchCurrentPage[counter])
      $scope.reSearchCurrentStart[counter] = (Math.ceil($scope.reSearchCurrentPage[counter] / $scope.reSearchPagerPageSize[counter]) - 1) * $scope.reSearchPagerPageSize[counter] + 1;
      console.log("####", $scope.reSearchCurrentStart[counter])

      reSearchInstance[counter].getResult(idx * $scope.reSearchPageSize[counter], $scope.reSearchPageSize[counter], function(message) {
        var fieldTypeArray = new Array();
        var fieldOrderArray = new Array();
        var tempArray = new Array();
        $scope.reSearchFields[counter] = new Array();

        for (var key in message.body.field_types) {
          if (tempArray.findIndex(obj => obj.key == key) === -1) tempArray.push({"key":key,"val":message.body.field_types[key]});
          if(key!="_table") fieldTypeArray.push(key);
          if(key=="_id" || key=="_time") fieldOrderArray.push(key);
        }
        fieldTypeArray.sort();
        if(typeof message.body.field_order != "undefined") {
          for(var i=0; i<message.body.field_order.length; i++) {
            if(message.body.field_order[i]!="_id" && message.body.field_order[i]!="_time" && message.body.field_order[i]!="_table") fieldOrderArray.push(message.body.field_order[i]);
          }
        }

        var diffArray = array_diff(fieldTypeArray,fieldOrderArray);
        var finalArray = union(fieldOrderArray,diffArray);


        for(var i=0;i<finalArray.length; i++) {
          var fieldData = tempArray.find(obj => obj.key === finalArray[i]);
          if(typeof fieldData !== "undefined") $scope.reSearchFields[counter].push(fieldData);
        }

        $scope.tdWidth = $scope.tableWidth / $scope.reSearchFields[counter].length;
        if($scope.tdWidth < 100) $scope.tdWidth = 100;
        $scope.reSearchInfo[counter].result = message.body.result;
        $scope.$apply()
      });
      makeReSearchPaginationInfo(counter);
    }

    $scope.reSearchJumpNext = function(counter) {
      $scope.reSearchCurrentPage[counter] = $scope.reSearchCurrentPage[counter] + $scope.reSearchPagerPageSize[counter];
      if ($scope.reSearchCurrentPage[counter] > $scope.reSearchPaginationCount[counter]) {
        $scope.reSearchCurrentPage[counter] = $scope.reSearchPaginationCount[counter];
      }
      $scope.reSearchPageChanged($scope.reSearchCurrentPage[counter], counter);
    }

    $scope.reSearchPageNext = function(counter) {
      $scope.reSearchCurrentPage[counter] = $scope.reSearchCurrentPage[counter] + 1;
      if ($scope.reSearchCurrentPage[counter] > $scope.reSearchPaginationCount[counter]) {
        $scope.reSearchCurrentPage[counter] = $scope.reSearchCurrentPage[counter] - 1;
      } else {
        $scope.reSearchPageChanged($scope.reSearchCurrentPage[counter], counter);
      }
    }

    $scope.reSearchJumpPrev = function(counter) {
      $scope.reSearchCurrentPage[counter] = $scope.reSearchCurrentPage[counter] - $scope.reSearchPagerPageSize[counter];
      if ($scope.reSearchCurrentPage[counter] < 1) {
        $scope.reSearchCurrentPage[counter] = 1;
      }
      $scope.reSearchPageChanged($scope.reSearchCurrentPage[counter], counter);
    }

    $scope.reSearchPagePrev = function(counter) {
      $scope.reSearchCurrentPage[counter] = $scope.reSearchCurrentPage[counter] - 1;
      if ($scope.reSearchCurrentPage[counter] < 1) {
        $scope.reSearchCurrentPage[counter] = $scope.reSearchCurrentPage[counter] + 1;
      } else {
        $scope.reSearchPageChanged($scope.reSearchCurrentPage[counter], counter);
      }
    }
    /* ---------------------------------------------------------------------------------------------------------------------
    * Pagination Set End
    * ---------------------------------------------------------------------------------------------------------------------*/

















































  }
})();
//# sourceURL=apps/datalog-kyochon/datalog-kyochon/datalog/kyochon_pos.js
