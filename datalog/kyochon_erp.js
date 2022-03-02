(function() {
  app.register.controller('DatalogERPSearchController', DatalogERPSearchController);

  function DatalogERPSearchController($scope, $q, $location, $http, socket, $filter, $state, $element, $window, serviceLogdb, $stateParams, serviceSession, serviceAuth, USER_LEVELS, $interval, $timeout, $templateCache, filterFilter, serviceNotification, serviceLogdbManagement) {
    console.log(":: ERP Page ::");

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
    $scope.searchSignValue = [
      "포함",
      "일치",
      "일치하지않음",
      "(숫자)일치",
      "이하",
      "이상",
    ];


    var logSearchInstance = null;
    var logSearchQuery;

    var statSearchInstance = null;
    var statSearchQuery;

    var downloadInstance = null;
    var downloadCount = 0;

    $scope.searchStartDate = getPastDate(1);
    $scope.searchEndDate = getPastDate(1);

    $scope.searchField = new Array();
    $scope.searchSign = new Array();
    $scope.searchValue = new Array();
    $scope.searchCondition = new Array();

    $scope.searchLimit = 0;
    $scope.searchPage = 100;
    $scope.logSearchPaginationArray = [];

    function makeSearchStrField(array, field) {
      var retStr = "";
      for(var i=0; i<array.length; i++) {
        retStr += field + " == \"" + array[i].key + "\" or "
      }
      retStr = retStr.substr(0, retStr.length-3);
      return retStr;
    }

    $scope.selectSearchSetting = {
      scrollableHeight: '300px',
      scrollable: true,
      enableSearch: true,
      displayProp: 'value',
      idProp: 'key',
      closeOnBlur: true,
    };


    /** ERP 조건 **/
    $scope.isDateSearch = false;
    $scope.searchStartDate = getPastDate(1);
    $scope.searchEndDate = getPastDate(1);

    $scope.isPartnerSearch = false;
    $scope.partnerSearchTexts = {
      buttonDefaultText:'거래처검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.partnerSearchEvent = {
      onSelectionChanged:function() {
        $scope.changePartner();
      }
    }
    $scope.searchPartnerList = [];
    $scope.searchPartnerStr = "";

    $scope.changePartner = function()  {
      $scope.searchPartnerStr = makeSearchStrField($scope.searchPartnerList, "CD_PARTNER")
      console.log($scope.searchPartnerStr);
    }

    $scope.isItemSearch = false;
    $scope.itemSearchTexts = {
      buttonDefaultText:'품목검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.itemSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeItem();
      }
    }
    $scope.searchItemList = [];
    $scope.searchItemStr = "";

    $scope.changeItem = function()  {
      $scope.searchItemStr = makeSearchStrField($scope.searchItemList, "CD_ITEM")
      console.log($scope.searchItemStr);
    }

    $scope.isStoreSearch = false;
    $scope.storeSearchTexts = {
      buttonDefaultText:'품목검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.storeSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeStore();
      }
    }
    $scope.searchStoreList = [];
    $scope.searchStoreStr = "";

    $scope.changeStore = function()  {
      $scope.searchStoreStr = makeSearchStrField($scope.searchStoreList, "CD_SL")
      console.log($scope.searchStoreStr);
    }

    $scope.isSalesGroupSearch = false;
    $scope.salesGroupSearchTexts = {
      buttonDefaultText:'영업그룹검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.salesGroupSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeSalesGroup();
      }
    }
    $scope.searchSalesGroupList = [];
    $scope.searchSalesGroupStr = "";

    $scope.changeSalesGroup = function()  {
      $scope.searchSalesGroupStr = makeSearchStrField($scope.searchSalesGroupList, "CD_SALEGRP")
      console.log($scope.searchSalesGroupStr);
    }


    $scope.isClassLSearch = false;
    $scope.classLSearchTexts = {
      buttonDefaultText:'대분류검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.classLSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeClassL();
      }
    }
    $scope.searchClassLList = [];
    $scope.searchClassLStr = "";

    $scope.changeClassL = function()  {
      $scope.searchClassLStr = makeSearchStrField($scope.searchClassLList, "CLS_L")
      console.log($scope.searchClassLStr);
    }

    $scope.isClassMSearch = false;
    $scope.classMSearchTexts = {
      buttonDefaultText:'중분류검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.classMSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeClassM();
      }
    }
    $scope.searchClassMList = [];
    $scope.searchClassMStr = "";

    $scope.changeClassM = function()  {
      $scope.searchClassMStr = makeSearchStrField($scope.searchClassMList, "CLS_M")
      console.log($scope.searchClassMStr);
    }

    $scope.isClassSSearch = false;
    $scope.classSSearchTexts = {
      buttonDefaultText:'소분류검색',
      checkAll: '모두 선택',
			uncheckAll: '모두 해제',
      dynamicButtonTextSuffix: '선택됨',
    }
    $scope.classSSearchEvent = {
      onSelectionChanged:function() {
        $scope.changeClassS();
      }
    }
    $scope.searchClassSList = [];
    $scope.searchClassSStr = "";

    $scope.changeClassS = function()  {
      $scope.searchClassSStr = makeSearchStrField($scope.searchClassSList, "CLS_S")
      console.log($scope.searchClassSStr);
    }


    // $scope.isPartnerCodeSearch = false;
    // $scope.searchPartnerCode = "";
    //
    // $scope.isPartnerNameSearch = false;
    // $scope.searchPartnerName = "";
    //
    // $scope.isItemCodeSearch = false;
    // $scope.searchItemCode = "";
    //
    // $scope.isItemNameSearch = false;
    // $scope.searchItemName = "";

    $scope.isShipingAmountSearch = false;
    $scope.searchShipingAmountFrom = 0;
    $scope.searchShipingAmountTo = 0;

    // $scope.isShipingStoreSearch = false;
    // $scope.searchShipingStore = "";

    // $scope.isSalesGroupSearch = false;
    // $scope.searchSalesGroup = "";

    $scope.isWonPriceSearch = false;
    $scope.searchWonPriceFrom = 0;
    $scope.searchWonPriceTo = 0;

    $scope.isVATSearch = false;
    $scope.searchVATFrom = 0;
    $scope.searchVATTo = 0;

    $scope.isTotalSearch = false;
    $scope.searchTotalFrom = 0;
    $scope.searchTotalTo = 0;
    /** ERP 조건 **/

    $scope.searchReset = function(type) {
      if(type=="basic") {
        $scope.isDateSearch = false;
        $("#searchStartDate").val(getPastDate(1));
        $("#searchEndDate").val(getPastDate(1));
      }
      else {
        $scope.isPartnerSearch = false;
        $scope.searchPartnerList = [];

        $scope.isItemSearch = false;
        $scope.searchItemList = [];

        $scope.isStoreSearch = false;
        $scope.searchStoreList = [];

        $scope.isSalesGroupSearch = false;
        $scope.searchSalesGroupList = [];

        $scope.isClassLSearch = false;
        $scope.searchClassLList = [];

        $scope.isClassMSearch = false;
        $scope.searchClassMList = [];

        $scope.isClassSSearch = false;
        $scope.searchClassSList = [];


        // $scope.isPartnerCodeSearch = false;
        // $scope.searchPartnerCode = "";
        //
        // $scope.isPartnerNameSearch = false;
        // $scope.searchPartnerName = "";
        //
        // $scope.isItemCodeSearch = false;
        // $scope.searchItemCode = "";
        //
        // $scope.isItemNameSearch = false;
        // $scope.searchItemName = "";

        $scope.isShipingAmountSearch = false;
        $scope.searchShipingAmountFrom = 0;
        $scope.searchShipingAmountTo = 0;

        // $scope.isShipingStoreSearch = false;
        // $scope.searchShipingStore = "";
        //
        // $scope.isSalesGroupSearch = false;
        // $scope.searchSalesGroup = "";

        $scope.isWonPriceSearch = false;
        $scope.searchWonPriceFrom = 0;
        $scope.searchWonPriceTo = 0;

        $scope.isVATSearch = false;
        $scope.searchVATFrom = 0;
        $scope.searchVATTo = 0;

        $scope.isTotalSearch = false;
        $scope.searchTotalFrom = 0;
        $scope.searchTotalTo = 0;
      }
    }


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
          searchStr += field + "==" + str;
          break;
        case "4":
          searchStr += field + "<=" + str;
          break;
        case "5":
          searchStr += field + ">=" + str;
          break;
        default:
          searchStr = "";
          break;
      }

      return searchStr;
    }

    var startTimeStamp = "";
    var endTimeStamp = "";

    $scope.tableERP = "MM_QTIO";

    $scope.lookupPartner = "KCERPPartner";
    $scope.lookupItem = "KCERPItem";
    $scope.lookupStore = "KCERPStore";
    $scope.lookupSalesGroup = "KCERPSalesGroup";

    $scope.lookupClassL = "KCERPClassL";
    $scope.lookupClassM = "KCERPClassM";
    $scope.lookupClassS = "KCERPClassS";

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
      var searchStr = "";
      var statsQuery = "";


      var querySB = new StringBuilder();
      var statSB = new StringBuilder();

      var searchStartDate = $("#searchStartDate").val();
      var searchEndDate = $("#searchEndDate").val();

      var endMoment = moment(searchEndDate);
      var addEndMoment = endMoment.add(1, "d").format("YYYY-MM-DD");
      var searchFromStr = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      var searchToStr = "to=" + addEndMoment.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";

      // var searchFromStr = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      // var searchToStr = "to=" + searchEndDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "235959";

      querySB.AppendFormat(" table {0} {1} {2}", searchFromStr, searchToStr, $scope.tableERP);
      querySB.Append(" | eval HS_WEIGHT = CNV_WEIGHT * QT_IO");
      //querySB.Append(" | fields NO_IO, DT_IO, CD_PARTNER, LN_PARTNER, CD_ITEM, NM_CLS_L, NM_CLS_M, NM_CLS_S, NM_ITEM, STND_ITEM, CNV_WEIGHT, CD_SL, NM_SL, QT_IO, UM, AM, VAT, MQ_SUM, NO_SO, CD_SALEGRP, NM_SALEGRP, DC_RMK, CD_SALEORG, NM_SALEORG");
      querySB.Append(" | fields NO_IO, DT_IO, CD_PARTNER, LN_PARTNER, CD_ITEM, CLS_L, CLS_M, CLS_S, NM_CLS_L, NM_CLS_M, NM_CLS_S, NM_ITEM, STND_ITEM, HS_WEIGHT, CD_SL, NM_SL, QT_IO, UM, AM, VAT, MQ_SUM, NO_SO, CD_SALEGRP, NM_SALEGRP, DC_RMK, CD_SALEORG, NM_SALEORG");
      // if ($scope.searchField.length > 0 && ($scope.searchField.length == $scope.searchSign.length)) {
      //   searchStr = " | search ";
      //   for (var i = 0; i < $scope.searchField.length; i++) {
      //     searchStr += getSearchString($scope.searchSign[i], $scope.searchField[i], $scope.searchValue[i])
      //     if (i < ($scope.searchField.length - 1)) searchStr += " " + $scope.searchCondition[i] + " ";
      //   }
      // }
      // console.log("searchStr", searchStr);
      // querySB.AppendFormat("{0}", searchStr);

      if($scope.isPartnerSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchPartnerStr);
      }
      if($scope.isItemSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchItemStr);
      }
      if($scope.isStoreSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchStoreStr);
      }
      if($scope.isSalesGroupSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchSalesGroupStr);
      }

      if($scope.isClassLSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchClassLStr);
      }
      if($scope.isClassMSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchClassMStr);
      }
      if($scope.isClassSSearch) {
        querySB.AppendFormat(" | search {0}", $scope.searchClassSStr);
      }


      // if($scope.isPartnerCodeSearch && $scope.searchPartnerCode!="") {
      //   querySB.AppendFormat(" | search CD_PARTNER == \"*{0}*\"", $scope.searchPartnerCode);
      // }
      // if($scope.isPartnerNameSearch && $scope.searchPartnerName!="") {
      //   querySB.AppendFormat(" | search LN_PARTNER == \"*{0}*\"", $scope.searchPartnerName);
      // }
      // if($scope.isItemCodeSearch && $scope.searchItemCode!="") {
      //   querySB.AppendFormat(" | search CD_ITEM == \"*{0}*\"", $scope.searchItemCode);
      // }
      // if($scope.isItemNameSearch && $scope.searchItemName!="") {
      //   querySB.AppendFormat(" | search NM_ITEM == \"*{0}*\"", $scope.searchItemName);
      // }
      if($scope.isShipingAmountSearch && $scope.searchShipingAmountFrom!=null && $scope.searchShipingAmountTo!=null) {
        querySB.AppendFormat(" | search QT_IO >= {0} and QT_IO <= {1}", $scope.searchShipingAmountFrom, $scope.searchShipingAmountTo);
      }
      // if($scope.isShipingStoreSearch && $scope.searchShipingStore!="") {
      //   querySB.AppendFormat(" | search NM_SL == \"*{0}*\"", $scope.searchShipingStore);
      // }
      // if($scope.isSalesGroupSearch && $scope.searchSalesGroup!="") {
      //   querySB.AppendFormat(" | search NM_SALEGRP == \"*{0}*\"", $scope.searchSalesGroup);
      // }
      if($scope.isWonPriceSearch && $scope.searchWonPriceFrom!=null && $scope.searchWonPriceTo!=null) {
        querySB.AppendFormat(" | search AM >= {0} and AM <= {1}", $scope.searchWonPriceFrom, $scope.searchWonPriceTo);
      }
      if($scope.isVATSearch && $scope.searchVATFrom!=null && $scope.searchVATTo!=null) {
        querySB.AppendFormat(" | search VAT >= {0} and VAT <= {1}", $scope.searchVATFrom, $scope.searchVATTo);
      }
      if($scope.isTotalSearch && $scope.searchTotalFrom!=null && $scope.searchTotalTo!=null) {
        querySB.AppendFormat(" | search MQ_SUM >= {0} and MQ_SUM <= {1}", $scope.searchTotalFrom, $scope.searchTotalTo);
      }

      querySB.Append(" | rename");
      querySB.Append(" NO_IO as 출고번호,");
      querySB.Append(" DT_IO as 출고일자,");
      querySB.Append(" CD_PARTNER as 거래처코드,");
      querySB.Append(" LN_PARTNER as 거래처,");
      querySB.Append(" CD_ITEM as 품목,");

      querySB.Append(" NM_CLS_L as 대분류,");
      querySB.Append(" NM_CLS_M as 중분류,");
      querySB.Append(" NM_CLS_S as 소분류,");

      querySB.Append(" NM_ITEM as 품목명,");
      querySB.Append(" STND_ITEM as 단위,");
      //querySB.Append(" CNV_WEIGHT as 환산중량,");
      querySB.Append(" HS_WEIGHT as 환산중량,");
      querySB.Append(" CD_SL as 창고코드,");
      querySB.Append(" NM_SL as 출하창고,");
      querySB.Append(" QT_IO as 출하수량,");
      querySB.Append(" UM as 출하단가,");
      querySB.Append(" AM as 원화금액,");
      querySB.Append(" VAT as 부가세,");
      querySB.Append(" MQ_SUM as 합계,");
      querySB.Append(" NO_SO as 수주번호,");
      querySB.Append(" CD_SALEGRP as 영업그룹코드,");
      querySB.Append(" NM_SALEGRP as 영업그룹명,");
      querySB.Append(" DC_RMK as 비고,");
      querySB.Append(" CD_SALEORG as 영업조직코드,");
      querySB.Append(" NM_SALEORG as 영업조직명");

      querySB.Append(" | fields - CLS_L, CLS_M, CLS_S");
      querySB.Append(" | order 출고번호,출고일자,거래처코드,거래처,품목,대분류,중분류,소분류,품목명,단위,환산중량,창고코드,출하창고,출하수량,출하단가,원화금액,부가세,합계,수주번호,영업그룹코드,영업그룹명,비고,영업조직코드,영업조직명");
    
      fianlQuery = querySB.ToString();
      statsQuery = querySB.ToString() + " | stats sum(출하수량) as 출하수량, sum(환산중량) as 환산중량, sum(원화금액) as 원화금액, sum(부가세) as 부가세, sum(합계) as 합계"

      if($scope.$parent.uid=="root" || $scope.$parent.uid=="logpresso") {
        console.log("Run Query : " + fianlQuery);
        // console.log("Stat Query : " + statsQuery);
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
      statSearchQuery = statSearchInstance.query(statsQuery, 100);

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

    $scope.searchCondition = new Array();
    $scope.logSearchForm = new Array();
    $scope.searchFieldArray = [
      {key:'CD_PARTNER', value:'거래처코드'},
      {key:'LN_PARTNER', value:'거래처'},
      {key:'CD_ITEM', value:'품목'},
      {key:'NM_ITEM', value:'품목명'},
      {key:'QT_IO', value:'출하수량'},
      {key:'NM_SL', value:'출하창고'},
      {key:'NM_SALEGRP', value:'영업그룹명'},
      {key:'AM', value:'원화금액'},
      {key:'VAT', value:'부가세'},
      {key:'MQ_SUM', value:'합계'},
    ]

    $scope.logSearchForm.push(0);
    $scope.logSearchAdd = function() {
      var inputValue = $scope.logSearchForm.length + 1;
      $scope.searchCondition.push("and");
      if (inputValue > 5) swal("ERP 조회", "조건을 더이상 추가 할 수 없습니다.", "error");
      else $scope.logSearchForm.push(inputValue);

      $timeout(function() {
        var reHeight = $(".card-search").offset().top + 1;
        var reWidth = $(window).width() - $(".card-table").width();
        divResize("card-search",reHeight, reWidth);
      },500)

    }
    $scope.logSearchDel = function(idx) {
      if ($scope.logSearchForm.length > 1) {
        $scope.logSearchForm.splice(idx, 1);
        $scope.searchField.splice(idx, 1);
        $scope.searchSign.splice(idx, 1);
        $scope.searchValue.splice(idx, 1);
        $scope.searchCondition.splice(idx, 1);
      } else if ($scope.logSearchForm.length == 1) {
        $scope.searchField[idx] = "";
        $scope.searchSign[idx] = "";
        $scope.searchValue[idx] = "";
        $scope.searchCondition[idx] = "and";
      } else {
        console.log("What");
      }

      $timeout(function() {
        var reHeight = $(".card-search").offset().top + 1;
        var reWidth = $(window).width() - $(".card-table").width();
        divResize("card-search",reHeight, reWidth);
      },500)
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

			XLSX.utils.book_append_sheet(wb, statData, "ERP 통계");
			var wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});

			/* generate a download */
			function s2ab(s) {
				var buf = new ArrayBuffer(s.length);
				var view = new Uint8Array(buf);
				for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
			}

			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "ERP Report.xlsx");
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

    var erpPartnerInstance = null;
    var erpPartnerQuery;

    var erpItemInstance = null;
    var erpItemQuery;

    var erpStoreInstance = null;
    var erpStoreQuery;

    var erpSalesGroupInstance = null;
    var erpSalesGroupQuery;

    var erpClassLInstance = null;
    var erpClassLQuery;
    var erpClassMInstance = null;
    var erpClassMQuery;
    var erpClassSInstance = null;
    var erpClassSQuery;

    var queryMaxCounter = 7000;


    function getERPPartnerList() {
      if(erpPartnerInstance!=null) {
        serviceLogdb.remove(erpPartnerInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.lookupPartner + " | fields partnerCode, partnerName | sort partnerName | rename partnerName as value, partnerCode as key";
      $scope.erpPartnerResult = [];
      erpPartnerInstance = serviceLogdb.create(pid);
      erpPartnerQuery = erpPartnerInstance.query(runQuery, queryMaxCounter);

      try {
        erpPartnerQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              console.log("partner Path tail", m)
              $scope.erpPartnerResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("partner fail", m)
          });

        serviceLogdb.remove(erpPartnerInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getERPItemList() {
      if(erpItemInstance!=null) {
        serviceLogdb.remove(erpItemInstance);
      }
      //김대성책임요청(21.07.07)
      //품목 리스트 가나다 순으로 정렬요청
      //특수문자() -> 한글 뒤로
      //@Hector

      var runQuery = "memlookup op=list name="+ $scope.lookupItem + " | rex field=itemName \"(?<bbb>^[^ㄱ-ㅎ|ㅏ-ㅣ|가-힣])\"";
      runQuery += " | search isnotnull(bbb)";
      runQuery += " | sort itemName";
      runQuery += " | union [ memlookup op=list name=" + $scope.lookupItem + " | rex field=itemName \"(?<aaa>^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣])\"";
      runQuery += " | search isnotnull(aaa)";
      runQuery += "	| sort itemName";
      runQuery += " ]";
      runQuery += " | fields itemCode, itemName";
      runQuery += " | rename itemName as value, itemCode as key";

      // console.log(runQuery);
    



      $scope.erpItemResult = [];
      erpItemInstance = serviceLogdb.create(pid);
      erpItemQuery = erpItemInstance.query(runQuery, queryMaxCounter);

      try {
        erpItemQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("sale Path tail", m)
              $scope.erpItemResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("item fail", m)
          });

        serviceLogdb.remove(erpItemInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getERPStoreList() {
      if(erpStoreInstance!=null) {
        serviceLogdb.remove(erpStoreInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.lookupStore + " | fields storeCode, storeName | sort storeName | rename storeName as value, storeCode as key";
      $scope.erpStoreResult = [];
      erpStoreInstance = serviceLogdb.create(pid);
      erpStoreQuery = erpStoreInstance.query(runQuery, queryMaxCounter);

      try {
        erpStoreQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("sale Path tail", m)
              $scope.erpStoreResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("store fail", m)
          });

        serviceLogdb.remove(erpStoreInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getERPSalesGroupList() {
      if(erpSalesGroupInstance!=null) {
        serviceLogdb.remove(erpSalesGroupInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.lookupSalesGroup + " | fields salesGroupCode, salesGroupName | sort salesGroupName | rename salesGroupName as value, salesGroupCode as key";
      $scope.erpSalesGroupResult = [];
      erpSalesGroupInstance = serviceLogdb.create(pid);
      erpSalesGroupQuery = erpSalesGroupInstance.query(runQuery, queryMaxCounter);

      try {
        erpSalesGroupQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("sale Path tail", m)
              $scope.erpSalesGroupResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("salesgroup fail", m)
          });

        serviceLogdb.remove(erpSalesGroupInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getERPClassLList() {
      if(erpClassLInstance!=null) {
        serviceLogdb.remove(erpClassLInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.lookupClassL + " | fields classCode, className | sort className | rename className as value, classCode as key";
      $scope.erpClassLResult = [];
      erpClassLInstance = serviceLogdb.create(pid);
      erpClassLQuery = erpClassLInstance.query(runQuery, queryMaxCounter);

      try {
        erpClassLQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("sale Path tail", m)
              $scope.erpClassLResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("classL fail", m)
          });

        serviceLogdb.remove(erpClassLInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getERPClassMList() {
      if(erpClassMInstance!=null) {
        serviceLogdb.remove(erpClassMInstance);
      }
      var runQuery = "memlookup op=list name=" + $scope.lookupClassM + " | fields classCode, className | sort className | rename className as value, classCode as key";
      $scope.erpClassMResult = [];
      erpClassMInstance = serviceLogdb.create(pid);
      erpClassMQuery = erpClassMInstance.query(runQuery, queryMaxCounter);

      try {
        erpClassMQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("sale Path tail", m)
              $scope.erpClassMResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("classM fail", m)
          });

        serviceLogdb.remove(erpClassMInstance);
      } catch (e) {
        console.log(e);
      }
    }

    function getERPClassSList() {
      if(erpClassSInstance!=null) {
        serviceLogdb.remove(erpClassSInstance);
      }
      /////////////////수정중~
      var runQuery = "memlookup op=list name=" + $scope.lookupClassS + " | fields classCode, className | sort className | rename className as value, classCode as key";
      $scope.erpClassSResult = [];
      erpClassSInstance = serviceLogdb.create(pid);
      erpClassSQuery = erpClassSInstance.query(runQuery, queryMaxCounter);

      try {
        erpClassSQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              //console.log("sale Path tail", m)
              $scope.erpClassSResult = getUniqueObjectArray(m.body.result, "key");
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("classS fail", m)
          });

        serviceLogdb.remove(erpClassSInstance);
      } catch (e) {
        console.log(e);
      }
    }

    getERPPartnerList();
    getERPItemList();
    getERPStoreList();
    getERPSalesGroupList();

    getERPClassLList();
    getERPClassMList();
    getERPClassSList();



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
      if(statSearchInstance!=null) {
        console.log("already stat exist query")
        serviceLogdb.remove(statSearchInstance);
      }

      if(erpPartnerInstance!=null) {
        console.log("already partner exist query")
        serviceLogdb.remove(erpPartnerInstance);
      }
      if(erpItemInstance!=null) {
        console.log("already item exist query")
        serviceLogdb.remove(erpItemInstance);
      }
      if(erpStoreInstance!=null) {
        console.log("already store exist query")
        serviceLogdb.remove(erpStoreInstance);
      }
      if(erpSalesGroupInstance!=null) {
        console.log("already salesgroup exist query")
        serviceLogdb.remove(erpSalesGroupInstance);
      }

      if(erpClassLInstance!=null) {
        console.log("already classl exist query")
        serviceLogdb.remove(erpClassLInstance);
      }
      if(erpClassMInstance!=null) {
        console.log("already classm exist query")
        serviceLogdb.remove(erpClassMInstance);
      }
      if(erpClassSInstance!=null) {
        console.log("already classs exist query")
        serviceLogdb.remove(erpClassSInstance);
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
        console.log("resize");
        var reHeight = $(".card-search").offset().top + 1;
        var reWidth = $(window).width() - $(".card-table").width();
        divResize("card-search",reHeight, reWidth);
      });
    });
  }
})();
//# sourceURL=apps/datalog-kyochon/datalog-kyochon/datalog/kyochon_pos.js
