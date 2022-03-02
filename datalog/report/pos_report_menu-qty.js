(function() {
  app.register.controller('DatalogMenuReportController', DatalogMenuReportController);

  function DatalogMenuReportController($scope, $q, $location, $http, socket, $filter, $state, $element, $window, $document, serviceLogdb, $stateParams, serviceSession, serviceAuth, USER_LEVELS, $interval, $timeout, $templateCache, filterFilter, serviceNotification, serviceLogdbManagement) {
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

    var logSearchInstance = null;
    var logSearchQuery;

    var fieldSearchInstance = null;
    var fieldSearchQuery;

    var downloadInstance = null;
    var downloadCount = 0;

    var logisticsSearchInstance = null;
    var logisticsSearchQuery;

    var franchiseSearchInstance = null;
    var franchiseSearchQuery;

    var menuGroupSearchInstance = null;
    var menuGroupSearchQuery;

    var menuNameSearchInstance = null;
    var menuNameSearchQuery;

    var startTimeStamp = "";
    var endTimeStamp = "";

    $scope.searchStartDate = getPastDate(1);
    $scope.searchEndDate = getPastDate(1);

    $scope.searchLimit = 0;
    $scope.logSearchPageSize = $scope.searchPage;

    var queryMaxCounter = 3000;


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
        //console.log("change", message);

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

      $scope.$apply();
    }
    function makeLogSearchResult(fieldObj, callback) {
      //fieldObj = sortObject(fieldObj);
      $scope.totalSumObj = new Object();
      $scope.rateSumObj = new Object();
      for(fieldKey in fieldObj) {
        if(fieldKey=="메뉴명" || fieldKey=="POS메뉴그룹명") {
          $scope.totalSumObj[fieldKey] = "합계";
          $scope.rateSumObj[fieldKey] = "비율";
        }
        else if(fieldKey=="비율<br>수량" || fieldKey=="비율<br>총액") {
          $scope.totalSumObj[fieldKey] = "";
          $scope.rateSumObj[fieldKey] = "";
        }
        else {
          $scope.totalSumObj[fieldKey] = 0;
          $scope.rateSumObj[fieldKey] = 0;
        }

      }
      callback();
    }

    function logSearchTail(helper) {
      helper.getResult(function(m) {
        console.log("Query Tail",m);
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

          makeLogSearchResult(m.body.field_types, function() {
            var result = m.body.result;

            for(var i=0;i<result.length; i++) {
              result[i] = sortObject(result[i]);
              for(fieldKey in result[i]) {
                if(fieldKey=="메뉴명" || fieldKey=="POS메뉴그룹명" || fieldKey=="비율<br>수량" || fieldKey=="비율<br>총액") {
                  //console.log(fieldKey)
                }
                else {
                  if(result[i][fieldKey]==null) result[i][fieldKey] = 0;

                  $scope.totalSumObj[fieldKey] = $scope.totalSumObj[fieldKey] + result[i][fieldKey];
                  if(i == result.length-1) {
                    if(fieldKey.indexOf("수량") != -1) {
                      $scope.rateSumObj[fieldKey] = ( $scope.totalSumObj[fieldKey] / $scope.totalSumObj["소계<br>수량"] ) * 100
                      //console.log(fieldKey, $scope.totalSumObj[fieldKey], $scope.rateSumObj[fieldKey], $scope.totalSumObj["소계<br>수량"])
                    }
                    else {
                      $scope.rateSumObj[fieldKey] = ( $scope.totalSumObj[fieldKey] / $scope.totalSumObj["소계<br>총액"] ) * 100
                      //console.log(fieldKey, $scope.totalSumObj[fieldKey], $scope.rateSumObj[fieldKey], $scope.totalSumObj["소계<br>총액"])
                    }
                    $scope.rateSumObj[fieldKey] = $scope.rateSumObj[fieldKey].toFixed(1) + " %"
                  }
                }
              }
            }
            $scope.logSearchResult = result;
            $scope.logSearchResult.push($scope.totalSumObj);
            $scope.logSearchResult.push($scope.rateSumObj);
          });


          $timeout(function() {
            var reHeight = $(".card-search").offset().top + 1;
            var reWidth = $(window).width() - $(".card-table").width();
            divResize("card-search",reHeight, reWidth);

            var mergeArray = [0];

            //SummerizeTable('#logList',mergeArray);
          },500);

          $scope.$apply()
        });

        $scope.logSearchTotalCount = helper.message.body.total_count;

        downloadInstance = logSearchInstance.getId();
        downloadCount = helper.message.body.total_count;

        $scope.isNowLoading = false;
        $scope.$apply();
      });
    }

    function logSearchLoaded(m) {
      //console.log("Query Loaded",m);
      endTimeStamp = new Date();
      $scope.processTime = msToTime(endTimeStamp - startTimeStamp);
      loading(false, "logSearchPanel");
      $scope.btnFlag = "ready";
      //serviceLogdb.remove(logSearchInstance);
    }

    function logSearchFailed(raw, type, note) {
      alert(raw[0].errorCode);
      loading(false, "logSearchPanel");
      $scope.btnFlag = "ready";
    }
    /***** Log Search Function **************************************************************************************************/

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

    $scope.menuGroupSearchTexts = {
      buttonDefaultText:'메뉴그룹검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.menuGroupSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeMenuGroup();
      }
    }

    $scope.menuNameSearchTexts = {
      buttonDefaultText:'메뉴명검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.menuNameSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeMenuName();
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
      $scope.searchFranchiseStr = makeSearchStrField($scope.searchFranchiseList, "franchiseCode")
    }

    $scope.isMenuGroupSearch = false;
    $scope.searchMenuGroupList = [];
    $scope.searchMenuGroupStr = "";

    $scope.changeMenuGroup = function() {
      $scope.searchMenuNameList = [];
      getMenuNameList();
    }

    $scope.isMenuNameSearch = false;
    $scope.searchMenuNameList = [];
    $scope.searchMenuNameStr = "";

    $scope.changeMenuName = function() {
      $scope.searchMenuNameStr = makeSearchStrField($scope.searchMenuNameList, "menuCode")
    }





    $scope.tableReport = "KCMenuStat";
    //20201210 변경... by chris
    //$scope.tableReport = "KCMenuStatQty"

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

    $scope.searchTotalLog = function() {
      $scope.processTime = 0;

      startTimeStamp = new Date();
      $scope.tableWidth = $("#mainTable").width();

      if(logSearchInstance!=null) {
        console.log("already log exist query")
        serviceLogdb.remove(logSearchInstance);
      }
      var fianlQuery = "";
      var searchStr = "";



      var searchStartDate = $("#searchStartDate").val();
      var searchEndDate = $("#searchEndDate").val();

      var endMoment = moment(searchEndDate);
      var addEndMoment = endMoment.add(1, "d").format("YYYY-MM-DD");
      var searchFromStr = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      var searchToStr = "to=" + addEndMoment.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";

      // var searchFromStr = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      // var searchToStr = "to=" + searchEndDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "235959";

      var baseQuerySB = new StringBuilder();
      baseQuerySB.AppendFormat(" table {0} {1} {2} | search menuCode!= \"BM*\"", searchFromStr, searchToStr, $scope.tableReport);

      var searchQuerySB = new StringBuilder();
      if($scope.searchBranchList.length > 0) {
        searchQuerySB.AppendFormat(" | search {0}", $scope.searchBranchStr);
      }
      if($scope.searchFranchiseList.length > 0) {
        searchQuerySB.AppendFormat(" | search {0}", $scope.searchFranchiseStr);
      }
      if($scope.searchMenuGroupList.length > 0) {
        searchQuerySB.AppendFormat(" | search {0}", $scope.searchMenuGroupStr);
      }
      if($scope.searchMenuNameList.length > 0) {
        searchQuerySB.AppendFormat(" | search {0}", $scope.searchMenuNameStr);
      }

      var baseQueryStr = baseQuerySB.ToString();
      var searchQueryStr = searchQuerySB.ToString();

      var joinKey = createGUID();


      /**** 20201207 수량 - 건수 임시 변경 by chris
      var querySB = new StringBuilder();
      querySB.AppendFormat("{0} {1}", baseQueryStr, searchQueryStr);
      querySB.Append(" | sort franchiseCode, menuCode, cDate");
      querySB.Append(" | repeat count=2");
      //querySB.Append(" | eval cDate = concat(cDate, \" (\", aWeekName,\")\"), cDate = if(mod(seq(),2)==0, concat(cDate, \" <br> 총액\"), concat(cDate, \" <br> 수량\")), cValue =  if(mod(seq(),2)==0, double(fAmt), double(count))");
      querySB.Append(" | eval cDate = concat(string(date(cDate, \"yyyy-MM-dd\"),\"MM-dd\"), \" (\", aWeekName,\")\"), cDate = if(mod(seq(),2)==0, concat(cDate, \" <br> 총액\"), concat(cDate, \" <br> 수량\")), cValue =  if(mod(seq(),2)==0, double(fAmt), double(count))");
      //querySB.Append(" | pivot last(cValue) by branchCode, branchName, franchiseCode, franchiseName, posGroupCode, posGroupName, menuCode, menuName  for cDate");
      querySB.Append(" | pivot sum(cValue) by posGroupCode, posGroupName, menuCode, menuName  for cDate");
      querySB.AppendFormat(" | eval joinKey = \"{0}\"", joinKey);

      // querySB.AppendFormat(" | join joinKey  [ {0} {1} | eval joinKey = \"{2}\" | eval count = double(count) , fAmt = double(fAmt)", baseQueryStr, searchQueryStr, joinKey);
      // querySB.Append(" | stats sum(count) as 합계수량, sum(fAmt) as 합계총액  by joinKey ]");
      querySB.AppendFormat(" | join posGroupCode  [ {0} {1} | eval joinKey = \"{2}\" | eval count = double(count) , fAmt = double(fAmt)", baseQueryStr, searchQueryStr, joinKey);
      querySB.Append(" | stats sum(count) as 합계수량, sum(fAmt) as 합계총액  by posGroupCode ]");

      querySB.AppendFormat(" | join menuCode [ {0} {1} | eval count = double(count) , fAmt = double(fAmt)", baseQueryStr, searchQueryStr);
      querySB.Append(" | stats sum(count) as 소계수량, sum(fAmt) as 소계총액 by menuCode ]");
      //querySB.Append(" | eval 비율수량 = concat(round( 합계수량/비율수량*100,2), \"%\"), 비율총액 = concat(round( 합계총액/비율총액*100,2), \"%\")]");
      querySB.Append(" | eval 비율수량 = concat(round( 소계수량/합계수량*100,1), \"%\"), 비율총액 = concat(round( 소계총액/합계총액*100,1), \"%\")");
      querySB.Append(" | eval _seq=1");
      querySB.Append(" | rename posGroupName as POS메뉴그룹명, menuName as 메뉴명");
      querySB.Append(" | rename 소계수량 as 소계<br>수량, 소계총액 as 소계<br>총액, 비율수량 as 비율<br>수량, 비율총액 as 비율<br>총액");
      querySB.Append(" | fields - posGroupCode, menuCode, _seq, joinKey, 합계수량, 합계총액");
      querySB.Append(" | order POS메뉴그룹명, 메뉴명, 소계<br>수량, 소계<br>총액, 비율<br>수량, 비율<br>총액");
      *****/

      var querySB = new StringBuilder();
      querySB.AppendFormat("{0} {1}", baseQueryStr, searchQueryStr);
      querySB.Append(" | sort franchiseCode, menuCode, cDate");
      querySB.Append(" | repeat count=2");
      //querySB.Append(" | eval cDate = concat(cDate, \" (\", aWeekName,\")\"), cDate = if(mod(seq(),2)==0, concat(cDate, \" <br> 총액\"), concat(cDate, \" <br> 수량\")), cValue =  if(mod(seq(),2)==0, double(fAmt), double(count))");
      querySB.Append(" | eval cDate = concat(string(date(cDate, \"yyyy-MM-dd\"),\"MM-dd\"), \" (\", aWeekName,\")\"), cDate = if(mod(seq(),2)==0, concat(cDate, \" <br> 총액\"), concat(cDate, \" <br> 수량\")), cValue =  if(mod(seq(),2)==0, double(fAmt), double(count))");
      //querySB.Append(" | pivot last(cValue) by branchCode, branchName, franchiseCode, franchiseName, posGroupCode, posGroupName, menuCode, menuName  for cDate");
      querySB.Append(" | pivot sum(cValue) by posGroupCode, posGroupName, menuCode, menuName  for cDate");
      querySB.AppendFormat(" | eval joinKey = \"{0}\"", joinKey);

      // querySB.AppendFormat(" | join joinKey  [ {0} {1} | eval joinKey = \"{2}\" | eval count = double(count) , fAmt = double(fAmt)", baseQueryStr, searchQueryStr, joinKey);
      // querySB.Append(" | stats sum(count) as 합계수량, sum(fAmt) as 합계총액  by joinKey ]");
      querySB.AppendFormat(" | join posGroupCode  [ {0} {1} | eval joinKey = \"{2}\" | eval count = double(count) , fAmt = double(fAmt)", baseQueryStr, searchQueryStr, joinKey);
      querySB.Append(" | stats sum(count) as 합계수량, sum(fAmt) as 합계총액  by posGroupCode ]");

      querySB.AppendFormat(" | join menuCode [ {0} {1} | eval count = double(count) , fAmt = double(fAmt)", baseQueryStr, searchQueryStr);
      querySB.Append(" | stats sum(count) as 소계수량, sum(fAmt) as 소계총액 by menuCode ]");
      //querySB.Append(" | eval 비율수량 = concat(round( 합계수량/비율수량*100,2), \"%\"), 비율총액 = concat(round( 합계총액/비율총액*100,2), \"%\")]");
      querySB.Append(" | eval 비율수량 = concat(round( 소계수량/합계수량*100,1), \"%\"), 비율총액 = concat(round( 소계총액/합계총액*100,1), \"%\")");
      querySB.Append(" | eval _seq=1");
      querySB.Append(" | rename posGroupName as POS메뉴그룹명, menuName as 메뉴명");
      querySB.Append(" | rename 소계수량 as 소계<br>수량, 소계총액 as 소계<br>총액, 비율수량 as 비율<br>수량, 비율총액 as 비율<br>총액");
      querySB.Append(" | fields - posGroupCode, menuCode, _seq, joinKey, 합계수량, 합계총액");
      querySB.Append(" | order POS메뉴그룹명, 메뉴명, 소계<br>수량, 소계<br>총액, 비율<br>수량, 비율<br>총액");

      fianlQuery = querySB.ToString();

      if($scope.$parent.uid=="root" || $scope.$parent.uid=="logpresso") {
        console.log("Run Query : " + fianlQuery);
      }

      $scope.logSearchFields = [];
      $scope.logSearchResult = [];
      $scope.btnFlag = "searching";

      logSearchInstance = serviceLogdb.create(pid);
      $scope.logSearchPageSize = $scope.searchPage;
      logSearchQuery = logSearchInstance.query(fianlQuery, queryMaxCounter);

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
      //serviceLogdb.remove(logSearchInstance);

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
			var wb = XLSX.utils.book_new();

      var searchStartDate = $("#searchStartDate").val();
      var searchEndDate = $("#searchEndDate").val();

      var Heading = [
        ["검색 기간", searchStartDate + " ~ " + searchEndDate]
      ];

      var logSearchExcel = new Object();
      logSearchExcel.field = $scope.logSearchFields;
      logSearchExcel.result = $scope.logSearchResult;

			var inputStatData = makeExcelData(logSearchExcel);

			//var statData = XLSX.utils.json_to_sheet(inputStatData);

      var statData = XLSX.utils.aoa_to_sheet(Heading);
      XLSX.utils.sheet_add_json(statData, inputStatData,{origin: "A2"});

			XLSX.utils.book_append_sheet(wb, statData, "메뉴별일자별");

			var wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});
			/* generate a download */
			function s2ab(s) {
				var buf = new ArrayBuffer(s.length);
				var view = new Uint8Array(buf);
				for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
			}

			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "Menu Report.xlsx");
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
      if(logSearchInstance!=null) {
        console.log("already log exist query")
        serviceLogdb.remove(logSearchInstance);
      }
      if(fieldSearchInstance!=null) {
        console.log("already field exist query")
        serviceLogdb.remove(fieldSearchInstance);
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

      if(menuGroupSearchInstance!=null) {
        console.log("already menu group exist query")
        serviceLogdb.remove(menuGroupSearchInstance);
      }
      if(menuNameSearchInstance!=null) {
        console.log("already menu name exist query")
        serviceLogdb.remove(menuNameSearchInstance);
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

    function getMenuGroupList() {
      if(menuGroupSearchInstance!=null) {
        serviceLogdb.remove(menuGroupSearchInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.tablePOSGroup + " | fields posGroupCode, posGroupName | rename posGroupName as value, posGroupCode as key";
      $scope.menuGroupSearchResult = [];
      menuGroupSearchInstance = serviceLogdb.create(pid);
      menuGroupSearchQuery = menuGroupSearchInstance.query(runQuery, queryMaxCounter);

      try {
        menuGroupSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("menu group tail", m)
              $scope.menuGroupSearchResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(menuGroupSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getMenuNameList() {
      if(menuNameSearchInstance!=null) {
        serviceLogdb.remove(menuNameSearchInstance);
      }
      $scope.menuNameSearchResult = [];
      if($scope.searchMenuGroupList.length > 0) {
        $scope.searchMenuGroupStr = makeSearchStrField($scope.searchMenuGroupList, "posGroupCode")
        var runQuery = "memlookup op=list name=" + $scope.tableMenuItem +" | search " + $scope.searchMenuGroupStr + " | fields menuCode, menuName | rename menuName as value, menuCode as key";
      }
      else {
        var runQuery = "memlookup op=list name=" + $scope.tableMenuItem +" | fields menuCode, menuName | rename menuName as value, menuCode as key";
      }
      menuNameSearchInstance = serviceLogdb.create(pid);
      menuNameSearchQuery = menuNameSearchInstance.query(runQuery, queryMaxCounter);

      try {
        menuNameSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("menu name tail", m)
              $scope.menuNameSearchResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(menuNameSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    getLogisticsList();
    getFranchiseList();
    getMenuGroupList();
    getMenuNameList();
  }
})();
//# sourceURL=apps/datalog-kyochon/datalog-kyochon/datalog/report/pos_report_menu.js
