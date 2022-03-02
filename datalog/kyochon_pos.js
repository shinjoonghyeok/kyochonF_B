(function() {
  app.register.controller('DatalogPOSSearchController', DatalogPOSSearchController);

  function DatalogPOSSearchController($scope, $q, $location, $http, socket, $filter, $state, $element, $window, $document, serviceLogdb, $stateParams, serviceSession, serviceAuth, USER_LEVELS, $interval, $timeout, $templateCache, filterFilter, serviceNotification, serviceLogdbManagement) {
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

    if($scope.$parent.userRole=="master" || $scope.$parent.userRole=="admin") {
      console.log("**********************************************")
    }





    $scope.processTime = 0;

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

    $scope.franchiseSizeSearchTexts = {
      buttonDefaultText:'가맹점규모검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.franchiseSizeSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeFranchiseSize();
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

    $scope.salesTypeSearchTexts = {
      buttonDefaultText:'판매유형검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.salesTypeSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeSalesType();
      }
    }

    $scope.orderStatusSearchTexts = {
      buttonDefaultText:'수금상태검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.orderStatusSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeOrderStatus();
      }
    }

    $scope.weekSearchTexts = {
      buttonDefaultText:'요일검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.weekSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeWeek();
      }
    }

    $scope.salesPathSearchTexts = {
      buttonDefaultText:'판매경로검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.salesPathSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeSalesPath();
      }
    }

    $scope.payMethodSearchTexts = {
      buttonDefaultText:'결제유형검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.payMethodSearchEvent = {
      onSelectionChanged:function() {
        $scope.changePayMethod();
      }
    }


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

    var statSearchInstance = null;
    var statSearchQuery;

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

    var salesPathSearchInstance = null;
    var salesPathSearchQuery;

    var payMethodSearchInstance = null;
    var payMethodSearchQuery;

    var franchiseSizeSearchInstance = null;
    var franchiseSizeSearchQuery;

    function makeSearchStrField(array, field) {
      var retStr = "";
      for(var i=0; i<array.length; i++) {
        retStr += field + " == \"" + array[i].key + "\" or "
      }
      retStr = retStr.substr(0, retStr.length-3);
      return retStr;
    }

    function makeSearchStrFieldForPath(array, field) {
      var retStr = "";
      for(var i=0; i<array.length; i++) {
        if(array[i].key=="N") {
          retStr += field + " == \"" + array[i].key + "\" or "
          retStr += field + " == \"\" or "
          retStr += field + " == null or "
        }
        /** 
         * 20210216 주문 경로 통합 수정으로 조건 추가(memlookup 도 동일하게 변경)
         * 온라인 O, 스마트폰 S 는 주문앱 (O) 로 memlookup 수정
         * O 일때 데이터는 O 와 S 를 검색
         * S 는 검색 조건에서 삭제 함(1269 line getSalesPathList)
         * by chris
        **/
        else if(array[i].key=="O") {     
          console.log("array", array, field)
          retStr += field + " == \"O\" or "
          retStr += field + " == \"S\" or "
        }
        else {
          retStr += field + " == \"" + array[i].key + "\" or "
        }
      }
      retStr = retStr.substr(0, retStr.length-3);
      return retStr;
    }

    $scope.isDateSearch = false;
    $scope.searchStartDate = getPastDate(1);
    $scope.searchEndDate = getPastDate(1);

    //테스트매장 제외옵션 default
    $scope.isincludeTestJum = true;

    $scope.isTimeSearch = false;
    $scope.searchStartTime = "00:00:00";
    $scope.searchEndTime = "23:59:59";

    $scope.isWeekSearch = false;
    $scope.weekSearchResult = [
      {key:"월",value:"월"},
      {key:"화",value:"화"},
      {key:"수",value:"수"},
      {key:"목",value:"목"},
      {key:"금",value:"금"},
      {key:"토",value:"토"},
      {key:"일",value:"일"},
    ];
    $scope.searchWeekList = [];
    $scope.searchWeekStr = "";
    $scope.changeWeek = function()  {
      $scope.searchWeekStr = makeSearchStrField($scope.searchWeekList, "cWeek")
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

    $scope.isFranchiseSizeSearch = false;
    $scope.searchFranchiseSize = {};
    $scope.searchFranchiseSizeList = [];
    $scope.searchFranchiseSizeStr = "";

    $scope.changeFranchiseSize = function()  {
      $scope.searchFranchiseSizeStr = makeSearchStrField($scope.searchFranchiseSizeList, "franchiseSize")

    }

    $scope.isSalesTypeSearch = false;
    $scope.salesTypeSearchResult = [
      {key:"배달",value:"배달"},
      {key:"포장",value:"포장"},
      {key:"테이블",value:"테이블"},
    ];
    $scope.searchSalesTypeList = [];
    $scope.searchSalesTypeStr = "";
    $scope.changeSalesType = function()  {
      $scope.searchSalesTypeStr = makeSearchStrField($scope.searchSalesTypeList, "cType")
    }

    $scope.isOrderStatusSearch = false;
    $scope.orderStatusSearchResult = [
      {key:"수금",value:"수금"},
      {key:"취소",value:"취소"},
      {key:"서비스",value:"서비스"},
    ];
    $scope.searchOrderStatusList = [];
    $scope.searchOrderStatusStr = "";
    $scope.changeOrderStatus = function()  {
      $scope.searchOrderStatusStr = makeSearchStrField($scope.searchOrderStatusList, "collectStatus")
    }

    $scope.isSalesPatheSearch = false;
    $scope.searchSalesPath = {};
    $scope.searchSalesPathList = [];
    $scope.searchSalesPathStr = "";

    $scope.changeSalesPath = function()  {
      $scope.searchSalesPathStr = makeSearchStrFieldForPath($scope.searchSalesPathList, "cCallType")
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
      $scope.searchMenuNameStr = makeSearchStrField($scope.searchMenuNameList, "cGoodcd")
    }


    $scope.isPayMethodSearch = false;

    $scope.isPayMethodeSearch = false;
    $scope.searchPayMethod = {};
    $scope.searchPayMethodList = [];
    $scope.searchPayMethodStr = "";

    $scope.changePayMethod = function()  {
      $scope.searchPayMethodStr = makeSearchStrField($scope.searchPayMethodList, "cTenderCd")
    }



    
    // $scope.istestJumSearch = false;

    // $scope.istestJumSearch = false;
    // $scope.searchtestJum = {};
    // $scope.searchtestJumList = [];
    // $scope.searchtestJumStr = "";
    // $scope.testJum = function()  {
    //   $scope.searchtestJumStr = makeSearchStrField($scope.searchtestJumList, "value")
    // }

    $scope.statType = "type"


    $scope.checkSearchMenu = function() {
      if($scope.isMenuGroupSearch || $scope.isMenuNameSearch) {
        $scope.isPayMethodSearch = false;
        $scope.isStatDate = false;
      }
    }
    $scope.checkSearchPay = function() {
      if($scope.isPayMethodSearch) {
        $scope.isMenuGroupSearch = false;
        $scope.isMenuNameSearch = false;
        $scope.isStatDate = false;
      }
    }

    $scope.checkSearchStat = function() {
      if($scope.isStatDate && ($scope.isMenuGroupSearch || $scope.isMenuNameSearch || $scope.isPayMethodSearch) ) {
        $scope.isStatDate = false;
      }
    }

    $scope.isStatDate = false;
    $scope.isStatFranchise = false


    $scope.searchReset = function(type) {
      if(type=="basic") {
        $scope.isBranchSearch = false;
        $scope.isFranchiseSearch = false;
        $scope.isFranchiseSizeSearch = false;
        $scope.isDateSearch = false;
        $scope.isWeekSearch = false;
        $scope.isTimeSearch = false;
        $scope.isincludeTestJum = false;
        $scope.isSalesTypeSearch = false;
        $scope.isSalesPathSearch = false;
        $scope.isOrderStatusSearch = false;

        $scope.searchBranchList = [];
        $scope.searchFranchiseList = [];
        $scope.searchFranchiseSizeList = [];
        $scope.searchWeekList = [];
        $scope.searchSalesTypeList = [];
        $scope.searchSalesPathList = [];

        $("#searchStartDate").val(getPastDate(1));
        $("#searchEndDate").val(getPastDate(1));
        $("#searchStartTime").val("00:00:00");
        $("#searchEndTime").val("23:59:59");

        getFranchiseList();
      }
      else if(type=="menu") {
        $scope.isMenuGroupSearch = false;
        $scope.isMenuNameSearch = false;

        $scope.searchMenuGroupList = [];
        $scope.searchMenuNameList = [];

        getMenuNameList();
      }
      else if(type=="payment") {
        $scope.isPayMethodSearch = false;

        $scope.searchPayMethodList = [];
      }
      else if(type=="sum") {
        $scope.isStatDate = false;
        $scope.isStatFranchise = false;
      }
      else {
        console.log("no reset item")
      }
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
    $scope.lookuptestFranchiseCode = "testFranchiseCode";

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

        $scope.isNowLoading = false;
        makeLogSearchPaginationInfo();
        $scope.$apply();
      });
    }

    function logSearchLoaded() {
      //console.log("Query Loaded");
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
      if(statSearchInstance!=null) {
        console.log("already stat exist query")
        serviceLogdb.remove(statSearchInstance);
      }

      var fianlQuery = "";
      var statsQuery = "";

      var querySB = new StringBuilder();
      var statSB = new StringBuilder();

      var searchStartDate = "";
      var searchEndDate = "";

      if($scope.isDateSearch) {
        searchStartDate = $("#searchStartDate").val();
        searchEndDate = $("#searchEndDate").val();
      }
      else {
        searchStartDate = getPastDate(1);
        searchEndDate = getPastDate(1);
      }
      var endMoment = moment(searchEndDate);
      var addEndMoment = endMoment.add(1, "d").format("YYYY-MM-DD");
      var searchFromStr = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      var searchToStr = "to=" + addEndMoment.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";

      console.log(searchFromStr);
      console.log(searchToStr);

      var fieldsStr = " | fields aOrder, 판매날짜, 매출일, 시간, 요일";
      var basicFieldStr = "";
      var groupByStr = "";
      var statGroupBy = "매출일";

      querySB.AppendFormat(" table {0} {1} {2}", searchFromStr, searchToStr, $scope.tableOrder);
      //querySB.AppendFormat(" table {0}",  $scope.tableOrder);
      querySB.Append(" | eval aOrder = concat(cDate, cJumCd, cBillno, cPosId)");

      // querySB.Append(" | sort limit=1 -_time by aOrder")

      querySB.Append(" | fields aOrder, SALE_DT,  cCallType, cDate, cTime, cWeek, cJumCd, cType, fAmt, fDcAmt, fTotalAmt, fManQty");
      querySB.Append(" | rename fAmt as fAmt1000, SALE_DT as SALE_DT1000");
      querySB.Append(" | eval lAmt1000 = fAmt1000 + fDcAmt");
      querySB.AppendFormat(" | search not(in(value,'null'))");




      querySB.AppendFormat(" | lookup {0} cJumCd output franchiseName", $scope.lookupFranchise);
      querySB.AppendFormat(" | lookup {0} cJumCd output branchCode", $scope.lookupFranchise);
      querySB.AppendFormat(" | lookup {0} cJumCd output franchiseSize", $scope.lookupFranchise);
      querySB.AppendFormat(" | lookup {0} cJumCd output seatCount", $scope.lookupFranchise);
      querySB.AppendFormat(" | lookup {0} branchCode output branchName", $scope.lookupBranch);
      querySB.AppendFormat(" | lookup {0} cCallType output pathName", $scope.lookupOrderPath);
      querySB.AppendFormat(" | lookup {0} franchiseSize output franchiseSizeName", $scope.lookupFranchiseSize);
     
      // querySB.AppendFormat(" | lookup testFranchiseCode cJumCd output value", $scope.lookuptestFranchiseCode);

      
      // querySB.AppendFormat(" | search isnull(value)", $scope.lookuptestFranchiseCode);
      //querySB.Append(" | search not(in(value,"/null/"))");
      //for except to 'test franchise' from result by Hector on 20210329 
      
      //@Hector 테스트매장 제외기능구현(룩업테이블 이용)

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////
      if($scope.isincludeTestJum) {
        querySB.AppendFormat(" | lookup {0} cJumCd output value", $scope.lookuptestFranchiseCode);
        querySB.Append(" | search isnull(value)");
      }
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////



      if($scope.isTimeSearch) {
        var searchStartTime = $("#searchStartTime").val();
        var searchEndTime = $("#searchEndTime").val();
        querySB.AppendFormat(" | search cTime >= \"{0}\" and cTime <= \"{1}\"", searchStartTime, searchEndTime);
      }
      if($scope.isWeekSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchWeekStr);
        groupByStr = " by 요일"
        groupByStr += " | eval weekNumber = case(요일==\"월\",1,요일==\"화\",2,요일==\"수\",3,요일==\"목\",4,요일==\"금\",5,요일==\"토\",6,요일==\"일\",7,8)"
        groupByStr += " | sort weekNumber"
        statGroupBy += ", 요일";
        // var weekSearchStr = "";
        // for(var i=0; i<$scope.searchSalesWeekArray.length; i++) {
        //   if($scope.searchSalesWeekArray[i].checked) {
        //     weekSearchStr += " cWeek == \"" + $scope.searchSalesWeekArray[i].value + "\" or"
        //   }
        // }
        // weekSearchStr = weekSearchStr.substr(0, weekSearchStr.length-3);
        // querySB.AppendFormat(" | search {0}", weekSearchStr);
      }

      if($scope.isBranchSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchBranchStr);
        fieldsStr += ", 지사명"
        groupByStr = " by 지사명"
        statGroupBy += ", 지사명";
      }
      if($scope.isFranchiseSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchFranchiseStr);
        fieldsStr += ", 지사명, 가맹점명, 가맹점규모, 좌석수"
        groupByStr = " by 가맹점명"
        statGroupBy += ", 가맹점명";
      }
      if($scope.isFranchiseSizeSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchFranchiseSizeStr);
        fieldsStr += ", 지사명, 가맹점명, 가맹점규모, 좌석수"
        groupByStr = " by 가맹점규모"
        statGroupBy += ", 가맹점규모";
      }
      if($scope.isSalesTypeSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchSalesTypeStr);
        fieldsStr += ", 판매유형"
        groupByStr = " by 판매유형"
        statGroupBy += ", 판매유형";
      }
      if($scope.isSalesPathSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchSalesPathStr);
        fieldsStr += ", 판매경로"
        groupByStr = " by 판매경로"
        statGroupBy += ", 판매경로";
      }

      if($scope.isSalesTypeSearch && $scope.isSalesPathSearch) {
        if($scope.statType=="type") {
          groupByStr = " by 판매유형, 판매경로";
          statGroupBy += ", 판매유형, 판매경로";
        }
        else {
          groupByStr = " by 판매경로, 판매유형";
          statGroupBy += ", 판매경로, 판매유형";
        }
      }

      if($scope.isOrderStatusSearch) {
        //querySB.Append(" | eval collectStatus = case(fAmt1000 > 0, \"수금\", \"취소\")");
        querySB.Append(" | eval collectStatus = case(fAmt1000 > 0, \"수금\", fAmt1000 < 0, \"취소\", \"서비스\")");
        //querySB.AppendFormat(" | search {0}", getSearchString($scope.searchSignOrderStatus, "collectStatus", $scope.searchOrderStatus));
        querySB.AppendFormat(" | search {0}", $scope.searchOrderStatusStr);
        fieldsStr += ", 수금상태"
        groupByStr = " by 수금상태"
      }

      querySB.Append(" | fields aOrder, SALE_DT1000, cDate, cTime, cWeek, cType, lAmt1000, fAmt1000, fDcAmt, fTotalAmt, fManQty, franchiseName, seatCount, branchName, pathName, franchiseSizeName, collectStatus");
      basicFieldStr = " , 매출, 할인, 총매출, 주문상태"


      if($scope.isPayMethodSearch) {
        querySB.AppendFormat(" | join type=left aOrder [ table {0} {1} {2} | fields cTenderCd,cType, fAmt,  cDate, cJumCd, cBillno, cPosId | eval aOrder = concat(cDate, cJumCd, cBillno, cPosId) ]", searchFromStr, searchToStr, $scope.tableSale);

        querySB.Append(" | fields aOrder, SALE_DT1000, cDate,cType, cTime, cWeek, fAmt, franchiseName, seatCount, branchName, pathName, franchiseSizeName, cTenderCd");
        querySB.AppendFormat(" | lookup {0} cTenderCd output payMethodName", $scope.lookupPayMethod);
        querySB.AppendFormat(" | search {0}", $scope.searchPayMethodStr);
        querySB.Append(" | fields aOrder, SALE_DT1000, cDate,cType, cTime, cWeek, fAmt, franchiseName, seatCount, branchName, pathName, franchiseSizeName, payMethodName");
        querySB.Append(" | rename fAmt as fAmt1200");
        querySB.Append(" | eval lAmt1200 = fAmt1200");
        

        fieldsStr += ", 결제유형"
        basicFieldStr = " , 매출"
        groupByStr = " by 결제유형"
      }

      // if($scope.istestJumSearch) {
      //   querySB.AppendFormat(" | join type=left aOrder [ table {0} {1} {2} | fields value, fAmt,  cDate, cJumCd, cBillno, cPosId | eval aOrder = concat(cDate, cJumCd, cBillno, cPosId) ]", searchFromStr, searchToStr, $scope.tableSale);

      //   querySB.Append(" | fields aOrder, SALE_DT1000, cDate, cTime, cWeek, fAmt, franchiseName, seatCount, branchName, pathName, franchiseSizeName, testJum");
      //   querySB.AppendFormat(" | lookup {0} testFranchiseCode cJumCd output value", $scope.lookuptestFranchiseCode);
      //   querySB.AppendFormat(" | search {0}", $scope.searchtestJumStr);
      //   querySB.Append(" | fields aOrder, SALE_DT1000, cDate, cTime, cWeek, fAmt, franchiseName, seatCount, branchName, pathName, franchiseSizeName, value");
      //   querySB.Append(" | rename fAmt as fAmt1200");
      //   querySB.Append(" | eval lAmt1200 = fAmt1200");

      //   fieldsStr += ", 테스트매장"
      //   basicFieldStr = " , 테스트매장"
      //   groupByStr = " by 테스트매장"
      // }
      //20210730 판매유형(cType)이 일부 테이블과의 join이 안되어있음(SALE1100)
      //류원무 책임 요청으로 수정완료 @by Hector
      if($scope.isMenuGroupSearch || $scope.isMenuNameSearch) {
        querySB.AppendFormat("| join type=left aOrder [ table {0} {1} {2} | fields cGoodcd fAmt, fDc, cDate, cJumCd, cBillno, cPosId, fQty, fDanga | eval aOrder = concat(cDate, cJumCd, cBillno, cPosId) ]", searchFromStr, searchToStr, $scope.tableMenu);
        querySB.Append(" | fields aOrder, SALE_DT1000, cDate, cTime, cWeek, cType, fAmt, fDc, franchiseName, seatCount, branchName, pathName, franchiseSizeName, cGoodcd, fQty, fDanga");
        querySB.Append(" | rename fAmt as fAmt1100");
        querySB.Append(" | eval lAmt1100 = fAmt1100 + fDc");

        querySB.AppendFormat(" | lookup {0} cGoodcd output menuName", $scope.lookupMenuItem);
        querySB.AppendFormat(" | lookup {0} cGoodcd output posGroupCode", $scope.lookupMenuItem);
        querySB.AppendFormat(" | lookup {0} posGroupCode output posGroupName", $scope.lookupPOSGroup);
        querySB.AppendFormat(" | lookup {0} cGoodcd output count", $scope.lookupChickenCount);

        //querySB.Append(" | eval posGroupName = case( (isnull(posGroupName) and substr(cGoodcd,0,2)==\"BM\"), \"베민\", (isnull(posGroupName) and substr(cGoodcd,0,2)!=\"BM\"), \"기타\", posGroupName) ");
        querySB.Append(" | eval posGroupName = if(substr(cGoodcd,0,2)==\"BM\", \"베민\", posGroupName)");
        querySB.Append(" | eval posGroupName = if(isnull(posGroupName) or posGroupName==\"null\", \"기타\", posGroupName)")
        // querySB.Append(" | search not(in(value,'null'))")


        if($scope.isMenuGroupSearch) {
          querySB.AppendFormat(" | search {0}", $scope.searchMenuGroupStr);
          groupByStr = " by POS메뉴그룹명"
        }
        if($scope.isMenuNameSearch) {
          querySB.AppendFormat(" | search {0}", $scope.searchMenuNameStr);
          groupByStr = " by 메뉴명"
        }

        querySB.Append(" | fields aOrder, SALE_DT1000, cDate, cTime, cWeek,cType, fAmt1100, lAmt1100, fDc, franchiseName, seatCount, branchName, pathName, franchiseSizeName, fQty, fDanga, menuName, posGroupName, count");
        // querySB.Append(" | search not(in(value,'null'))")


        // chris / 20201201 / 마릿수는 수량 * 마릿수 로 출력 한다.
        // querySB.Append(" | eval count = double(count)");
        querySB.Append(" | eval count = double(count) * fQty");
 

        fieldsStr += ",POS메뉴그룹명, 메뉴명, 수량, 마릿수, 단가, 판매유형";
        basicFieldStr = " , 매출, 할인, 총매출"
      }

      querySB.Append(" | rename");
      querySB.Append(" SALE_DT1000 as 판매날짜,");
      querySB.Append(" cDate as 매출일,");
      querySB.Append(" cTime as 시간,");
      querySB.Append(" cWeek as 요일,");

      querySB.Append(" branchName as 지사명,");
      querySB.Append(" franchiseName as 가맹점명,");
      querySB.Append(" franchiseSizeName as 가맹점규모,");
      querySB.Append(" seatCount as 좌석수,");

      if($scope.isPayMethodSearch) {
        querySB.Append(" fAmt1200 as 매출,");
        querySB.Append(" lAmt1200 as 총매출,");
      }

      else if($scope.isMenuGroupSearch || $scope.isMenuNameSearch) {
        querySB.Append(" fAmt1100 as 매출,");
        querySB.Append(" lAmt1100 as 총매출,");
        querySB.Append(" fDc as 할인,");
      }
      else {
        querySB.Append(" fAmt1000 as 매출,");
        querySB.Append(" lAmt1000 as 총매출,");
        querySB.Append(" fDcAmt as 할인,");
      }
      

      //querySB.Append(" fAmt as 매출,");
      querySB.Append(" collectStatus as 수금상태,");

      querySB.Append(" pathName as 판매경로,");
      querySB.Append(" payMethodName as 결제유형,");


      querySB.Append(" fQty as 수량,");
      querySB.Append(" fDanga as 단가,");
      querySB.Append(" menuName as 메뉴명,");
      querySB.Append(" posGroupName as POS메뉴그룹명,");
      querySB.Append(" count as 마릿수,");

      querySB.Append(" cType as 판매유형,");
      //querySB.Append(" fTotalAmt as 총매출,");

      querySB.Append(" fManQty as 주문상태");

      querySB.AppendFormat("{0} {1}", fieldsStr, basicFieldStr);
      querySB.Append(" | fields - aOrder, 판매날짜");

      var statBaseStr = "";
      if($scope.isPayMethodSearch) {
        statBaseStr = " | stats count as 건수, sum(매출) as 매출합계";
        statsQuery = querySB.ToString() + statBaseStr + groupByStr
      }
      else if($scope.isMenuGroupSearch || $scope.isMenuNameSearch) {
        statBaseStr = " | stats count as 건수, sum(수량) as 수량합계, sum(마릿수) as 마릿수합계, sum(매출) as 매출합계, sum(할인) as 할인합계, sum(총매출) as 총매출합계";
        //statBaseStr = " | stats sum(수량) as 건수, sum(매출) as 매출합계, sum(할인) as 할인합계, sum(총매출) as 총매출합계, sum(마릿수) as 마릿수합계, sum(수량) as 수량합계";
        statsQuery = querySB.ToString() + statBaseStr + groupByStr + " | eval 마릿수합계 = round(마릿수합계,1)"
      }
      else {
        statBaseStr = " | stats count as 건수, sum(매출) as 매출합계, sum(할인) as 할인합계, sum(총매출) as 총매출합계";
        statsQuery = querySB.ToString() + statBaseStr + groupByStr
      }

      if($scope.isStatDate) {
        querySB.AppendFormat("{0} by {1}", statBaseStr, statGroupBy);
      }
      
      // if($scope.isStatDate && !$scope.isStatFranchise) {
      //   querySB.Append(statBaseStr + " by 매출일");
      // }
      // else if(!$scope.isStatDate && $scope.isStatFranchise) {
      //   querySB.Append(statBaseStr + " by 가맹점명");
      // }
      // else if($scope.isStatDate && $scope.isStatFranchise) {
      //   querySB.Append(statBaseStr + " by 매출일, 가맹점명");
      // }

      fianlQuery = querySB.ToString();

      if($scope.$parent.uid=="root" || $scope.$parent.uid=="logpresso") {
        console.log("Run Query : " + fianlQuery);
        console.log("Stat Query : " + statsQuery);
        // console.log("group by : ", groupByStr);
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

      $scope.statSearchResult = [];
      statSearchInstance = serviceLogdb.create(pid);
      statSearchQuery = statSearchInstance.query(statsQuery, queryMaxCounter);

      try {
        statSearchQuery
          .started(function(m) {
            console.log("stat start",m);
          })
          .onHead(function(m){
            console.log("stat header", m);
          })
          .onStatusChange(function(m) {
            console.log("stat change", m)
          })
          .onTail(function(helper) {
            helper.getResult(function(m) {
              console.log("stat tail", m)
              $scope.statSearchField = m.body.field_order;
              $scope.statSearchResult = m.body.result;

              $timeout(function() {
                var reHeight = $(".card-search").offset().top + 1;
                var reWidth = $(window).width() - $(".card-table").width();
                divResize("card-search",reHeight, reWidth);
              },500);
              $scope.$apply();
            })

          })
          .loaded(function(m) {
            console.log("stat loaded", m)
          })
          .failed(function(m) {
            //console.log("stat fail", m)
          });

        serviceLogdb.remove(statSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    $scope.searchStop = function() {
      logSearchInstance.stop();
      statSearchInstance.stop();

      // serviceLogdb.remove(logSearchInstance);
      // serviceLogdb.remove(statSearchInstance);

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
      //console.log(tableArray)
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


    /***************************************
    Get Filter Condition
    ****************************************/
    function getFranchiseSizeList() {
      if(franchiseSizeSearchInstance!=null) {
        serviceLogdb.remove(franchiseSizeSearchInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.tableFranchiseSize + " | fields franchiseSizeCode, franchiseSizeName | rename franchiseSizeName as value, franchiseSizeCode as key";
      $scope.franchiseSizeSearchResult = [];
      franchiseSizeSearchInstance = serviceLogdb.create(pid);
      franchiseSizeSearchQuery = franchiseSizeSearchInstance.query(runQuery, queryMaxCounter);

      try {
        franchiseSizeSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("Franchise Size tail", m)
              $scope.franchiseSizeSearchResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(franchiseSizeSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }


    function getSalesPathList() {
      if(salesPathSearchInstance!=null) {
        serviceLogdb.remove(salesPathSearchInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.tableOrderPath + " | fields pathCode, pathName | rename pathName as value, pathCode as key";
      $scope.salesPathSearchResult = [];
      salesPathSearchInstance = serviceLogdb.create(pid);
      salesPathSearchQuery = salesPathSearchInstance.query(runQuery, queryMaxCounter);

      try {
        salesPathSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("sale Path tail", m)
              var salePath = getUniqueObjectArray(m.body.result, "key");
              for(var i=0; i<salePath.length; i++) {
                //20210216 온라인과 스마트폰 통합으로 스마트폰(S) 삭제
                if(!(salePath[i].key == "" || salePath[i].key == "S"))  {
                  $scope.salesPathSearchResult.push(salePath[i]);
                }
              }
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(salesPathSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getPayMethodList() {
      if(payMethodSearchInstance!=null) {
        serviceLogdb.remove(payMethodSearchInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.tablePayMethod + " | fields payMethodCode, payMethodName | rename payMethodName as value, payMethodCode as key";
      $scope.payMethodSearchResult = [];
      payMethodSearchInstance = serviceLogdb.create(pid);
      payMethodSearchQuery = payMethodSearchInstance.query(runQuery, queryMaxCounter);

      try {
        payMethodSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("pay method tail", m)
              $scope.payMethodSearchResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(payMethodSearchInstance);
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

    //@Hector
    function getFranchiseList() {
      if(franchiseSearchInstance!=null) {
        serviceLogdb.remove(franchiseSearchInstance);
      }
      $scope.franchiseSearchResult = [];
      if($scope.searchBranchList.length > 0) {
        $scope.searchBranchStr = makeSearchStrField($scope.searchBranchList, "branchCode")
        var runQuery = "memlookup op=list name=" + $scope.tableFranchise +" | lookup testFranchiseCode franchiseCode output value | search isnull(value) | sort franchiseName | search " + $scope.searchBranchStr + " | fields franchiseName,franchiseCode | rename franchiseName as value, franchiseCode as key";
      }
      else {
        var runQuery = "memlookup op=list name=" + $scope.tableFranchise +" | lookup testFranchiseCode franchiseCode output value | search isnull(value) | sort franchiseName | fields franchiseName,franchiseCode | rename franchiseName as value, franchiseCode as key";
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
      if(statSearchInstance!=null) {
        console.log("already stat exist query")
        serviceLogdb.remove(statSearchInstance);
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
      if(salesPathSearchInstance!=null) {
        console.log("already sale Path exist query")
        serviceLogdb.remove(salesPathSearchInstance);
      }
      if(payMethodSearchInstance!=null) {
        console.log("already pay Method exist query")
        serviceLogdb.remove(payMethodSearchInstance);
      }
      if(franchiseSizeSearchInstance!=null) {
        console.log("already franchise size exist query")
        serviceLogdb.remove(franchiseSizeSearchInstance);
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
    //   if(statSearchInstance!=null) {
    //     console.log("already stat exist query")
    //     serviceLogdb.remove(statSearchInstance);
    //   }
    //   if(logisticsSearchInstance!=null) {
    //     console.log("already logistics exist query")
    //     serviceLogdb.remove(logisticsSearchInstance);
    //   }
    //   if(franchiseSearchInstance!=null) {
    //     console.log("already franchise exist query")
    //     serviceLogdb.remove(franchiseSearchInstance);
    //   }
    // });

    $(function() {
      $(window).resize(function() {
        var reHeight = $(".card-search").offset().top + 1;
        var reWidth = $(window).width() - $(".card-table").width();
        divResize("card-search",reHeight, reWidth);
      });
    });
    window.addEventListener('resize', function() {
      var reHeight = $(".card-search").offset().top + 1;
      var reWidth = $(window).width() - $(".card-table").width();
      divResize("card-search",reHeight, reWidth);
    }, true);


    getLogisticsList();
    getFranchiseList();

    getMenuGroupList();
    getMenuNameList();

    getSalesPathList();
    getPayMethodList();
    getFranchiseSizeList();






  }
})();
//# sourceURL=apps/datalog-kyochon/datalog-kyochon/datalog/kyochon_pos.js
