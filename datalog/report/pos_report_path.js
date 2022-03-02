(function() {
  app.register.controller('DatalogPathReportController', DatalogPathReportController);

  function DatalogPathReportController($scope, $q, $location, $http, socket, $filter, $state, $element, $window, $document, serviceLogdb, $stateParams, serviceSession, serviceAuth, USER_LEVELS, $interval, $timeout, $templateCache, filterFilter, serviceNotification, serviceLogdbManagement) {
    console.log(":: Report menu Page ::");

    $(function() {
      $('#startDatePicker,#endDatePicker').datetimepicker({
        sideBySide: true,
        format: 'YYYY-MM-DD'
      });

      $('#startTimePicker,#endTimePicker').datetimepicker({
        sideBySide: true,
        format: 'HH:mm:ss'
      });
    });
    $scope.resizeMode = "OverflowResizer";

    $scope.processTime = 0;
    $scope.btnFlag = "ready";

    var typeSearchInstance = null;
    var typeStatusSearchQuery;

    var pathSearchInstance = null;
    var pathSearchQuery;

    var downloadInstance = null;
    var downloadCount = 0;

    var logisticsSearchInstance = null;
    var logisticsSearchQuery;

    var franchiseSearchInstance = null;
    var franchiseSearchQuery;

    var pathFieldSearchInstance = null;
    var pathFieldSearchQuery;

    var startTimeStamp = "";
    var endTimeStamp = "";

    $scope.searchStartDate = getPastDate(1);
    $scope.searchEndDate = getPastDate(1);

    $scope.searchLimit = 0;
    $scope.logSearchPageSize = $scope.searchPage;

    $scope.nowDateArray = [];
    $scope.preDateArray = [];

    //테스트매장 제외옵션 default
    $scope.isincludeTestJum = true;


    var queryMaxCounter = 400;

    $scope.selectSearchSetting = {
      scrollableHeight: '300px',
      scrollable: true,
      enableSearch: true,
      displayProp: 'value',
      idProp: 'key',
      closeOnBlur: true,
    };

    $scope.branchSearchTexts = {
      buttonDefaultText:'지사검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.branchSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeBranch();
      }
    }
    $scope.franchiseSearchTexts = {
      buttonDefaultText:'가맹점검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.franchiseSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeFranchise();
      }
    }

    $scope.isBranchSearch = false;
    $scope.searchBranch = {};
    $scope.searchBranchList = [];
    $scope.searchBranchStr = "";

    $scope.changeBranch = function()  {
      $scope.searchFranchiseList = [];
      getFranchiseList();
    }

    $scope.isFranchiseSearch = false;
    $scope.searchFranchise = {};
    $scope.searchFranchiseList = [];
    $scope.searchFranchiseStr = "";

    $scope.changeFranchise = function()  {
      $scope.searchFranchiseStr = makeSearchStrField($scope.searchFranchiseList, "cJumCd")
    }


    $scope.tableReport = "SALE1000";

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


    function makeReportScreen(arr) {
      var retArr = [];
      for(var i=0; i<arr.length; i++) {
        var target = arr[i];
        var targetDate = target.cDate;
        retArr[targetDate] = new Object();

        retArr[targetDate]["주문건수:전체"] = 0;
        retArr[targetDate]["주문금액:전체"] = 0;

        Object.keys(target).forEach(function(key) {
          if(key!='cDate') {
            retArr[targetDate][key] = target[key];
            if(key.indexOf("건수") != -1) retArr[targetDate]["주문건수:전체"] += target[key];
            else retArr[targetDate]["주문금액:전체"] += target[key];
          }
        });
      }
      console.log("retArr", retArr);

      return retArr;
    }

    function makeReportStat(searchResult, searchField) {
      var retArray = new Array();
      /****** Now *****/
      var nowSumObj = new Object();
      var totalCount = 0;

      for(var i=0; i<$scope.nowDateArray.length; i++) {
        var dateKey = $scope.nowDateArray[i].date;
        var target = searchResult[dateKey];

        if(typeof target != "undefined") {
          Object.keys(target).forEach(function(key) {
            if(i==0) nowSumObj[key] = target[key];
            else nowSumObj[key] += target[key];

            if(key.indexOf("건수") != -1 && key.indexOf("전체") == -1) totalCount = totalCount + target[key];
          });
        }
      }

      var nowAvgObj = new Object();
      Object.keys(nowSumObj).forEach(function(key) {
        nowAvgObj[key] = ( nowSumObj[key] / $scope.nowDateArray.length );
      });

      var nowRateObj = new Object();
      var statField = new Array();

      for(var i=0; i<searchField.length; i++) {
        //if(i==0) var totalCount = nowSumObj[searchField[i]];
        if(i%2 == 0) {
          nowRateObj[searchField[i]] = ( ( nowSumObj[searchField[i]] / totalCount ) * 100 );
          statField.push(searchField[i]);
        }
      }
      /****** Now *****/
      retArray.push(nowSumObj);
      retArray.push(nowAvgObj);
      retArray.push(nowRateObj);
      retArray.push(statField);

      /****** Pre *****/
      var preSumObj = new Object();
      for(var i=0; i<$scope.preDateArray.length; i++) {
        var dateKey = $scope.preDateArray[i].date;
        var target = searchResult[dateKey];

        if(typeof target != "undefined") {
          Object.keys(target).forEach(function(key) {
            if(i==0) preSumObj[key] = target[key];
            else preSumObj[key] += target[key];
          });
        }
      }

      var preAvgObj = new Object();
      Object.keys(preSumObj).forEach(function(key) {
        preAvgObj[key] = ( preSumObj[key] / $scope.preDateArray.length );
      });

      var preRateObj = new Object();
      Object.keys(preSumObj).forEach(function(key) {
        preRateObj[key] = ( ( (nowSumObj[key] - preSumObj[key]) / nowSumObj[key] ) * 100 );
      });
      /****** Pre *****/
      retArray.push(preSumObj);
      retArray.push(preAvgObj);
      retArray.push(preRateObj);

      return retArray;
    }

    $scope.searchPathReport = function() {
      $scope.processTime = 0;

      startTimeStamp = new Date();
      $scope.tableWidth = $("#mainTable").width();

      if(typeSearchInstance!=null) {
        console.log("already typeSearchInstance exist query")
        serviceLogdb.remove(typeSearchInstance);
      }
      if(pathSearchInstance!=null) {
        console.log("already pathSearchInstance exist query")
        serviceLogdb.remove(pathSearchInstance);
      }

      var searchStartDate = $("#searchStartDate").val();
      var searchEndDate = $("#searchEndDate").val();
      var startMoment = moment(searchStartDate);
      var endMoment = moment(searchEndDate);

      var startMomentCal = moment(searchStartDate);
      var endMomentCal = moment(searchEndDate);

      var dateDiff = startMoment.diff(endMoment, 'days');
      if(dateDiff > 0) {
        swal("보고서","날짜 선택을 확인해 주세요","error");
        return;
      }
      dateDiff = Math.abs(dateDiff);
      if(dateDiff > 31) {
        swal("보고서","1달 이상 선택 할 수 없습니다.","error");
        return;
      }

      $scope.nowDateArray = [];
      $scope.preDateArray = [];
      while (startMomentCal <= endMomentCal) {
        $scope.nowDateArray.push( {date:moment(startMomentCal).format('YYYY-MM-DD'), week:moment(startMomentCal).format('ddd')} )
        $scope.preDateArray.push( {date:moment(startMomentCal).add(-1, 'year').format('YYYY-MM-DD'), week:moment(startMomentCal).add(-1, 'year').format('ddd')} )
        startMomentCal = moment(startMomentCal).add(1, 'days');
      }

      var typeQuery = " | pivot count as 주문건수, sum(fAmt) as 주문금액  by cDate for cType"
      typeQuery += " | order 주문건수:배달, 주문금액:배달, 주문건수:포장, 주문금액:포장, 주문건수:테이블, 주문금액:테이블"

      //var pathQuery = " | eval pathCode = cCallType";
      var pathQuery = " | lookup KCOrderPath cCallType output pathName"
      pathQuery += " | pivot count as 주문건수, sum(fAmt) as 주문금액  by cDate for pathName";
      pathQuery += " | rename 주문건수:null	as 주문건수:기타, 주문금액:null as 주문금액:기타";
      pathQuery += " | order cDate, 주문건수:가맹점접수, 주문금액:가맹점접수, 주문건수:콜센타주문, 주문금액:콜센타주문, 주문건수:온라인주문, 주문금액:온라인주문,주문건수:스마트폰주문, 주문금액:스마트폰주문, 주문건수:요기요, 주문금액:요기요, 주문건수:네이버, 주문금액:네이버, , 주문건수:배달의민족, 주문금액:배달의민족, 주문건수:위메프오, 주문금액:위메프오";


      var addEndMoment = endMoment.add(1, "d").format("YYYY-MM-DD");
      var searchFromStrNow = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      var searchToStrNow = "to=" + addEndMoment.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";

      // var searchFromStrNow = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      // var searchToStrNow = "to=" + searchEndDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "235959";
      var searchStartDatePre = startMoment.add("-1", "y").format("YYYY-MM-DD");
      var searchEndDatePre = endMoment.add("-1", "y").format("YYYY-MM-DD");

      var searchFromStrPre = "from=" + searchStartDatePre.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      var searchToStrPre = "to=" + searchEndDatePre.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";

      var searchBranchQuery = new StringBuilder();
      var searchFranchiseQuery = new StringBuilder();

      if($scope.searchBranchList.length > 0) {
        searchBranchQuery.AppendFormat(" | search {0}", $scope.searchBranchStr);
      }
      if($scope.searchFranchiseList.length > 0) {
        searchFranchiseQuery.AppendFormat(" | search {0}", $scope.searchFranchiseStr);
      }


      var commonQuery =" | fields cCallType, cDate, cJumCd, cType, fAmt";
      commonQuery += " | lookup KCFranchise cJumCd output franchiseName | lookup KCFranchise cJumCd output branchCode";
      if($scope.isincludeTestJum) {
        commonQuery += " | lookup testFranchiseCode cJumCd output value";
        commonQuery += " | search isnull(value)";
      }
      //@testing hector

      var mainNowQuery = new StringBuilder();
      var mainPreQuery = new StringBuilder();
      mainNowQuery.AppendFormat("table {0} {1} {2} {3} {4} {5}", searchFromStrNow, searchToStrNow, $scope.tableReport, commonQuery, searchBranchQuery.ToString(), searchFranchiseQuery.ToString());
      mainPreQuery.AppendFormat("table {0} {1} {2} {3} {4} {5}", searchFromStrPre, searchToStrPre, $scope.tableReport, commonQuery, searchBranchQuery.ToString(), searchFranchiseQuery.ToString());



      var typeQuerySB = new StringBuilder();
      var pathQuerySB = new StringBuilder();

      typeQuerySB.AppendFormat("{0} {1} | union [ {2} {3} ]", mainNowQuery.ToString(), typeQuery, mainPreQuery.ToString(), typeQuery);
      pathQuerySB.AppendFormat("{0} {1} | union [ {2} {3} ]", mainNowQuery.ToString(), pathQuery, mainPreQuery.ToString(), pathQuery);

      // var reportQuery = new Array();
      // reportQuery.push(typeQuerySB.ToString())
      // reportQuery.push(pathQuerySB.ToString())
      // console.log(reportQuery)

      if($scope.$parent.uid=="root" || $scope.$parent.uid=="logpresso") {
        console.log("Type Query : " + typeQuerySB.ToString());
        console.log("Path Query : " + pathQuerySB.ToString());
      }
      

      $scope.btnFlag = "searching";
      loading(true, "logSearchPanel");

      $scope.typeSearchResult = [];
      $scope.typeSearchField = [];
      typeSearchInstance = serviceLogdb.create(pid);
      typeSearchQuery = typeSearchInstance.query(typeQuerySB.ToString(), queryMaxCounter);
      try {
        typeSearchQuery
          .started(function() {
            console.log("type start")
          })
          .onHead(function() {})
          .onStatusChange(function() {})
          .onTail(function(h) {
            h.getResult(function(m) {
              console.log("type tail", m)
              $scope.typeSearchResult = makeReportScreen(m.body.result);

              $scope.typeSearchField.push("주문건수:전체");
              $scope.typeSearchField.push("주문금액:전체");
              if(m.body.result.length > 0) {
                for(var i=0; i<m.body.field_order.length; i++) {
                  $scope.typeSearchField.push(m.body.field_order[i]);
                }
              }

              var statResult = makeReportStat($scope.typeSearchResult, $scope.typeSearchField);

              $scope.typeNowStatSum = statResult[0];
              $scope.typeNowStatAvg = statResult[1];
              $scope.typeNowStatRate = statResult[2];
              $scope.typeStatField = statResult[3];
              $scope.typePreStatSum = statResult[4];
              $scope.typePreStatAvg = statResult[5];
              $scope.typePreStatRate = statResult[6];

              $scope.$apply();
            });
          })
          .loaded(function() {
            console.log("type loaded")
            $scope.btnFlag = "ready";
            loading(false, "logSearchPanel");
          })
          .failed(function() {
            $scope.btnFlag = "ready";
            loading(false, "logSearchPanel");
          });

        serviceLogdb.remove(typeSearchInstance);
      } catch (e) {
        console.log(e);
      }

      $scope.pathSearchResult = [];
      $scope.pathSearchField = [];
      pathSearchInstance = serviceLogdb.create(pid);
      pathSearchQuery = pathSearchInstance.query(pathQuerySB.ToString(), queryMaxCounter);
      try {
        pathSearchQuery
          .started(function() {
            console.log("path start")
          })
          .onHead(function() {})
          .onStatusChange(function() {})
          .onTail(function(h) {
            h.getResult(function(m) {
              console.log("path tail", m)

              $scope.pathSearchResult = makeReportScreen(m.body.result);

              for(var i=0; i<$scope.pathFieldSearchResult.length; i++) {
                $scope.pathSearchField.push("주문건수:" + $scope.pathFieldSearchResult[i].pathName);
                $scope.pathSearchField.push("주문금액:" + $scope.pathFieldSearchResult[i].pathName);
              }

              var statResult = makeReportStat($scope.pathSearchResult, $scope.pathSearchField);
              $scope.pathNowStatSum = statResult[0];
              $scope.pathNowStatAvg = statResult[1];
              $scope.pathNowStatRate = statResult[2];
              $scope.pathStatField = statResult[3];
              $scope.pathPreStatSum = statResult[4];
              $scope.pathPreStatAvg = statResult[5];
              $scope.pathPreStatRate = statResult[6];

              $scope.$apply();

            });
          })
          .loaded(function() {
            console.log("path loaded")
            $scope.btnFlag = "ready";
            loading(false, "logSearchPanel");
          })
          .failed(function() {
            $scope.btnFlag = "ready";
            loading(false, "logSearchPanel");
          });

        serviceLogdb.remove(pathSearchInstance);
      } catch (e) {
        console.log(e);
      }




    }

    $scope.searchStop = function() {
      typeSearchInstance.stop();
      pathSearchInstance.stop();
      //serviceLogdb.remove(logSearchInstance);

      loading(false, "logSearchPanel");
      $scope.btnFlag = "ready";
    }

    function makeExcelData(tableArray) {
			var retArray = new Array();

			for(var i=0; i<tableArray.result.length; i++) {
				var retObj = new Object();
				for( var j=0; j<tableArray.field.length; j++) {
					var objName = tableArray.field[j].key;
          var fieldObjName = objName.replace("<br>","");
					retObj[fieldObjName] = tableArray.result[i][objName];
				}
				retArray.push(retObj);
			}
			return retArray;
		}
    $scope.saveReportExcel = function() {
      var wb = XLSX.utils.table_to_book(document.getElementById("reportExcel"),{sheet:"Sheet 1"});
      var wbout = XLSX.write(wb, {bookType:'xlsx',  bookSST:true, type: 'binary'});

			function s2ab(s) {
				var buf = new ArrayBuffer(s.length);
				var view = new Uint8Array(buf);
				for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
			}

			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "Channel Report.xlsx");
		}


    $scope.logSearchDownload = function() {
      if (downloadInstance != "" && downloadCount != 0) {
        $('.answer-download').modal();

        $('.answer-download answer-exportes')[0].setId(downloadInstance, downloadCount);
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
      if(typeSearchInstance!=null) {
        console.log("already typeSearchInstance exist query")
        serviceLogdb.remove(typeSearchInstance);
      }
      if(pathSearchInstance!=null) {
        console.log("already pathSearchInstance exist query")
        serviceLogdb.remove(pathSearchInstance);
      }

      if(downloadInstance!=null) {
        console.log("already download exist query")
        serviceLogdb.remove(downloadInstance);
      }
      if(logisticsSearchInstance!=null) {
        console.log("already logistics exist query")
        serviceLogdb.remove(logisticsSearchInstance);
      }
      if(franchiseSearchInstance!=null) {
        console.log("already franchise exist query")
        serviceLogdb.remove(franchiseSearchInstance);
      }
    });

    // $scope.$on("$locationChangeSuccess", function(event) {
    //   console.log("Search Page Move");
    //   if(logSearchInstance!=null) {
    //     console.log("already log exist query")
    //     serviceLogdb.remove(logSearchInstance);
    //   }
    //   if(fieldSearchInstance!=null) {
    //     console.log("already field exist query")
    //     serviceLogdb.remove(fieldSearchInstance);
    //   }
    //   if(downloadInstance!=null) {
    //     console.log("already download exist query")
    //     serviceLogdb.remove(downloadInstance);
    //   }
    // });

    $(function() {
      $(window).resize(function() {
        console.log("resize");
        var reHeight = $(".card-search").offset().top + 1;
        var reWidth = $(window).width() - $(".card-table").width();
        divResize("card-search",reHeight, reWidth);
      });
    });


    function makeSearchStrField(array, field) {
      var retStr = "";
      for(var i=0; i<array.length; i++) {
        retStr += field + " == \"" + array[i].key + "\" or "
      }
      retStr = retStr.substr(0, retStr.length-3);
      return retStr;
    }
    function getLogisticsList() {
      if(logisticsSearchInstance!=null) {
        serviceLogdb.remove(logisticsSearchInstance);
      }
      //var runQuery = "table " + $scope.tableLogistics + " | sort branchName | fields branchName, branchCode | rename branchName as value, branchCode as key";
      var runQuery = "memlookup op=list name=" + $scope.tableLogistics + " | sort branchName | fields branchName, branchCode | rename branchName as value, branchCode as key";
      $scope.branchSearchResult = [];
      logisticsSearchInstance = serviceLogdb.create(pid);
      logisticsSearchQuery = logisticsSearchInstance.query(runQuery, queryMaxCounter);

      try {
        logisticsSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("logistics tail", m)
              $scope.branchSearchResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(logisticsSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getFranchiseList() {
      if(franchiseSearchInstance!=null) {
        serviceLogdb.remove(franchiseSearchInstance);
      }
      $scope.franchiseSearchResult = [];
      if($scope.searchBranchList.length > 0) {
        $scope.searchBranchStr = makeSearchStrField($scope.searchBranchList, "branchCode")
        var runQuery = "memlookup op=list name=" + $scope.tableFranchise +" | sort franchiseName | search nowStatus==\"00\" and franchiseName != \"*테스트*\" and franchiseName != \"*교육*\" and franchiseSize != \"1900003\" | search " + $scope.searchBranchStr + " | fields franchiseName, franchiseCode | rename franchiseName as value, franchiseCode as key";
      }
      else {
        var runQuery = "memlookup op=list name=" + $scope.tableFranchise +" | sort franchiseName | search nowStatus==\"00\" and franchiseName != \"*테스트*\" and franchiseName != \"*교육*\" and franchiseSize != \"1900003\" | fields franchiseName, franchiseCode | rename franchiseName as value, franchiseCode as key";
      }

      franchiseSearchInstance = serviceLogdb.create(pid);
      franchiseSearchQuery = franchiseSearchInstance.query(runQuery, queryMaxCounter);

      try {
        franchiseSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("franchise tail", m)
              $scope.franchiseSearchResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(franchiseSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getPathFieldList() {
      if(pathFieldSearchInstance!=null) {
        serviceLogdb.remove(pathFieldSearchInstance);
      }
      $scope.pathFieldSearchResult = [];
      var runQuery = "memlookup op=list name=" + $scope.lookupOrderPath + " | sort  pathCode";

      pathFieldSearchInstance = serviceLogdb.create(pid);
      pathFieldSearchQuery = pathFieldSearchInstance.query(runQuery, queryMaxCounter);

      try {
        pathFieldSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("franchise tail", m)
              $scope.pathFieldSearchResult = getUniqueObjectArray(m.body.result, "pathName");
              serviceLogdb.remove(pathFieldSearchInstance);
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(pathFieldSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    getLogisticsList();
    getFranchiseList();
    getPathFieldList();

  }
})();
//# sourceURL=apps/datalog-kyochon/datalog-kyochon/datalog/report/pos_report_path.js
