(function() {
    app.register.controller('DatalogMenuReport1100Controller', DatalogMenuReport1100Controller);
  
    function DatalogMenuReport1100Controller($scope, $q, $location, $http, socket, $filter, $state, $element, $window, $document, serviceLogdb, $stateParams, serviceSession, serviceAuth, USER_LEVELS, $interval, $timeout, $templateCache, filterFilter, serviceNotification, serviceLogdbManagement) {
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
        var queryMaxCounter = 3000;

        //테스트매장 제외옵션 default
        $scope.isincludeTestJum = true;


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
            console.log("change", message, $scope.searchField);
            // $scope.logSearchTotalCount = message.body.count;

            // logSearchInstance.getResult(0, $scope.logSearchPageSize, function(message) {
            //     //console.log("change", message);

            //     var fieldTypeArray = new Array();
            //     var fieldOrderArray = new Array();
            //     var tempArray = new Array();
            //     $scope.logSearchFields = new Array();

            //     for (var key in message.body.field_types) {
            //         if (tempArray.findIndex(obj => obj.key == key) === -1) tempArray.push({"key":key,"val":message.body.field_types[key]});
            //         if(key!="_table") fieldTypeArray.push(key);
            //         if(key=="_id" || key=="_time") fieldOrderArray.push(key);
            //     }
            //     fieldTypeArray.sort();
            //     if(typeof message.body.field_order != "undefined") {
            //         for(var i=0; i<message.body.field_order.length; i++) {
            //             if(message.body.field_order[i]!="_id" && message.body.field_order[i]!="_time" && message.body.field_order[i]!="_table") fieldOrderArray.push(message.body.field_order[i]);
            //         }
            //     }

            //     var diffArray = array_diff(fieldTypeArray,fieldOrderArray);
            //     var finalArray = union(fieldOrderArray,diffArray);


            //     for(var i=0;i<finalArray.length; i++) {
            //         var fieldData = tempArray.find(obj => obj.key === finalArray[i]);
            //         if(typeof fieldData !== "undefined") $scope.logSearchFields.push(fieldData);
            //     }

            //     $scope.tdWidth = $scope.tableWidth / $scope.logSearchFields.length;
            //     if($scope.tdWidth < 100) $scope.tdWidth = 100;
            //     $scope.logSearchResult = message.body.result;

            //     $timeout(function() {
            //         var reHeight = $(".card-search").offset().top + 1;
            //         var reWidth = $(window).width() - $(".card-table").width();
            //         divResize("card-search",reHeight, reWidth);
            //     },500);

            //     $scope.$apply()
            // });

            $scope.$apply();
        }

        function makeLogSearchResultOld(fieldObj, callback) {
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

        function makeLogSearchTotal(records) {
            var retArray = [];
            var regExpCount = /^\d{4}-\d{2}-\d{2}-c$/;
            var regExpMoney = /^\d{4}-\d{2}-\d{2}-m$/;
            
            for(var i=0; i<records.length; i++) {
                records[i].sumCount = 0;
                records[i].sumMoney = 0;
                for (var key in records[i]) {
                    if(regExpCount.test(key)) records[i].sumCount += records[i][key];
                    if(regExpMoney.test(key)) records[i].sumMoney += records[i][key];
                }

                retArray.push(records[i]);
            }

            return retArray;
        }

        function makeLogSearchTotalValue(records) {
            var totalValue = {};

            for(var i=0; i<$scope.logSearchFields.length; i++) {
                if($scope.logSearchFields[i].key=="posGroupName") totalValue[$scope.logSearchFields[i].key] = "합계";
                else if($scope.logSearchFields[i].key=="menuName") totalValue[$scope.logSearchFields[i].key] = "합계";
                // else if($scope.logSearchFields[i].key=="rateCount" || $scope.logSearchFields[i].key=="rateMoney") console.log("d")
                //if( !($scope.logSearchFields[i].key=="posGroupName" || $scope.logSearchFields[i].key=="menuName" || $scope.logSearchFields[i].key=="rateCount" || $scope.logSearchFields[i].key=="rateMoney") ) {
                else {
                    totalValue[$scope.logSearchFields[i].key] = 0;
                    for(var j=0; j<records.length; j++) {
                        totalValue[$scope.logSearchFields[i].key] += records[j][$scope.logSearchFields[i].key];
                    }
                }
            }
            return totalValue;
        }

        function makeLogSearchTotalRate() {
            var totalRate = {};
            var regExpCount = /^\d{4}-\d{2}-\d{2}-c$/;
            var regExpMoney = /^\d{4}-\d{2}-\d{2}-m$/;

            for(var i=0; i<$scope.logSearchFields.length; i++) {
                var keyName = $scope.logSearchFields[i].key;
                if(keyName=="posGroupName") totalRate[keyName] = "비율";
                else if(keyName=="menuName") totalRate[keyName] = "비율";
                else if(keyName=="sumCount" || keyName=="sumMoney") totalRate[keyName] = 0;
                else if(keyName=="rateCount" || keyName=="rateMoney") totalRate[keyName] = 0;
                //if( !($scope.logSearchFields[i].key=="posGroupName" || $scope.logSearchFields[i].key=="menuName" || $scope.logSearchFields[i].key=="rateCount" || $scope.logSearchFields[i].key=="rateMoney") ) {
                else {
                    if(regExpCount.test(keyName)) totalRate[keyName] = ( $scope.totalValue[keyName] /  $scope.totalValue['sumCount'] ) * 100
                    if(regExpMoney.test(keyName)) totalRate[keyName] = ( $scope.totalValue[keyName] /  $scope.totalValue['sumMoney'] ) * 100
                }
            }

            for(var i=0; i<$scope.logSearchFields.length; i++) {
                var keyName = $scope.logSearchFields[i].key;
                if(regExpCount.test(keyName)) totalRate['sumCount'] += totalRate[keyName];
                if(regExpMoney.test(keyName)) totalRate['sumMoney'] += totalRate[keyName];
            }

            return totalRate;
        }

        function makeLogSearchRate() {
            for(var i=0; i<$scope.logSearchResult.length; i++) {
                $scope.logSearchResult[i].rateCount = ($scope.logSearchResult[i].sumCount / $scope.totalValue.sumCount) * 100;
                $scope.logSearchResult[i].rateMoney = ($scope.logSearchResult[i].sumMoney / $scope.totalValue.sumMoney) * 100;
            }
        }

        function logSearchTail(helper) {
            helper.getResult(function(m) {
                // console.log("Query Tail",m);
                logSearchInstance.getResult(0, queryMaxCounter, function(message) {
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
                        if(typeof fieldData !== "undefined" && !(fieldData.key=="posGroupCode" || fieldData.key=="menuCode")) {
                            if(fieldData.key=="menuName") {
                                $scope.logSearchFields.push(fieldData);
                                $scope.logSearchFields.push({key:"sumCount", val: "string"});
                                $scope.logSearchFields.push({key:"sumMoney", val: "string"});
                                $scope.logSearchFields.push({key:"rateCount", val: "string"});
                                $scope.logSearchFields.push({key:"rateMoney", val: "string"});
                            }
                            else $scope.logSearchFields.push(fieldData);
                        }
                    }
                    $scope.tdWidth = $scope.tableWidth / $scope.logSearchFields.length;
                    if($scope.tdWidth < 100) $scope.tdWidth = 100;

                    
                    $scope.logSearchResult = makeLogSearchTotal(m.body.result);
                    $scope.totalValue = makeLogSearchTotalValue(m.body.result)
                    $scope.totalRate = makeLogSearchTotalRate()
                    
                    $scope.logSearchResult.push($scope.totalValue);
                    $scope.logSearchResult.push($scope.totalRate);

                    makeLogSearchRate();

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


        //$scope.tableReport = "KCMenuStat";
        //20201210 변경... by chris
        //20201223 SALE1100 에서 처리 하는 것으로 수정
        $scope.tableReport = "SALE1100";

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

            var searchStartDate = $("#searchStartDate").val();
            var searchEndDate = $("#searchEndDate").val();

            var endMoment = moment(searchEndDate);
            var addEndMoment = endMoment.add(1, "d").format("YYYY-MM-DD");
            var searchFromStr = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
            var searchToStr = "to=" + addEndMoment.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";

            // var searchFromStr = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
            // var searchToStr = "to=" + searchEndDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "235959";

            var baseQuerySB = new StringBuilder();
            baseQuerySB.AppendFormat(" table {0} {1} {2}", searchFromStr, searchToStr, $scope.tableReport);
            baseQuerySB.Append(" | search cGoodcd!= \"BM*\"");
            baseQuerySB.Append(" | fields cJumCd, cGoodcd, cDate, fAmt, fDanga, fDc, fQty");
            baseQuerySB.Append(" | stats count, sum(fAmt) as fAmt, sum(fQty) as fQty by cJumCd, cGoodcd, cDate ");

            baseQuerySB.Append(" | lookup KCFranchise cJumCd output franchiseName, branchCode");
            baseQuerySB.Append(" | lookup KCBranch branchCode output branchName");
            baseQuerySB.Append(" | lookup KCMenu cGoodcd output menuName, posGroupCode");
            baseQuerySB.Append(" | lookup KCPOSGroup posGroupCode output posGroupName");
            // baseQuerySB.Append(" | lookup testFranchiseCode cJumCd output value");

            baseQuerySB.Append(" | fields cDate, count, fAmt, fQty, branchName, franchiseName, posGroupName, menuName, cJumCd, branchCode, posGroupCode, cGoodcd, value");
            baseQuerySB.Append(" | rename cJumCd as franchiseCode, cGoodcd as menuCode ");
            // baseQuerySB.Append(" | search isnull(value)");
            //for except to 'test franchise' from result by Hector on 20210329 

            ///Search Condition
            if($scope.searchBranchList.length > 0) {
                baseQuerySB.AppendFormat(" | search {0}", $scope.searchBranchStr);
            }
            if($scope.searchFranchiseList.length > 0) {
                baseQuerySB.AppendFormat(" | search {0}", $scope.searchFranchiseStr);
            }
            if($scope.searchMenuGroupList.length > 0) {
                baseQuerySB.AppendFormat(" | search {0}", $scope.searchMenuGroupStr);
            }
            if($scope.searchMenuNameList.length > 0) {
                baseQuerySB.AppendFormat(" | search {0}", $scope.searchMenuNameStr);
            }
            /////////////////////////////////////////////////////////////////////////////
            if($scope.isincludeTestJum) {
                baseQuerySB.Append(" | lookup testFranchiseCode franchiseCode output value");
                baseQuerySB.AppendFormat(" | search isnull(value)", $scope.lookuptestFranchiseCode);
            }
           //////20210510 Hector////////////////////////////////////////////////

            baseQuerySB.Append(" | sort franchiseCode, menuCode, cDate");
            baseQuerySB.Append(" | repeat count=2 ");
            baseQuerySB.Append(" | eval cType = if(mod(seq(),2)==0, concat(cDate, \"-m\"), concat(cDate, \"-c\")), cValue =  if(mod(seq(),2)==0, double(fAmt), double(fQty))");
            baseQuerySB.Append(" | pivot sum(cValue) by posGroupCode, posGroupName, menuCode, menuName  for cType");
            
            fianlQuery = baseQuerySB.ToString();

            if($scope.$parent.uid=="root" || $scope.$parent.uid=="logpresso") {
                console.log("Run Query : " + fianlQuery);
            }

            $scope.logSearchFields = [];
            $scope.logSearchResult = [];
            $scope.btnFlag = "searching";

            logSearchInstance = serviceLogdb.create(pid);
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
        
        function makeExcelField(fieldArr) {
            var retArray = []
            for(var i=0; i<fieldArr.length; i++) {
                switch(fieldArr[i]) {
                    case "posGroupName":
                        retArray.push("포스그룹");
                    break;
                    case "menuName":
                        retArray.push("메뉴명");
                    break;
                    case "sumCount":
                        retArray.push("소계수량");
                    break;
                    case "sumMoney":
                        retArray.push("소계총액");
                    break;
                    case "rateCount":
                        retArray.push("비율수량");
                    break;
                    case "rateMoney":
                        retArray.push("비율총액");
                    break;
                    default:
                        var regExp = /^\d{4}-\d{2}-\d{2}-[cm]$/;
                        if(regExp.test(fieldArr[i])) {
                            var strArr = fieldArr[i].split("-");
                            var typeStr = "수량";
                            if(strArr[3]=="m") typeStr = "총액"
                            retArray.push(strArr[0] + "-" + strArr[1] + "-" + strArr[2] + "(" + typeStr + ")");
                        }
                        else retArray.push(fieldArr[i]);
                    break;
                }
            }

            return retArray
        }


        function KCMenuReportFieldName(fieldStr) {
            switch(fieldStr) {
                case "posGroupName":
                    return "포스그룹";
                break;
                case "menuName":
                    return "메뉴명";
                break;
                case "sumCount":
                    return "소계수량";
                break;
                case "sumMoney":
                    return "소계총액";
                break;
                case "rateCount":
                    return "비율수량";
                break;
                case "rateMoney":
                    return "비율총액";
                break;
                default:
                    var regExp = /^\d{4}-\d{2}-\d{2}-[cm]$/;
                    if(regExp.test(fieldStr)) {
                        var strArr = fieldStr.split("-");
                        var typeStr = "수량";
                        if(strArr[3]=="m") typeStr = "총액"
                        return strArr[0] + "-" + strArr[1] + "-" + strArr[2] + "(" + typeStr + ")";
                    }
                    else return fieldStr;
                break;
            }
        }

        function makeExcelData(tableArray) {
            var retArray = new Array();

            for(var i=0; i<tableArray.result.length; i++) {
                var retObj = new Object();
                for( var j=0; j<tableArray.field.length; j++) {
                    var objName = tableArray.field[j].key;
                    //var fieldObjName = objName.replace("<br>","");
                    var fieldObjName = KCMenuReportFieldName(objName);
                    retObj[fieldObjName] = tableArray.result[i][objName];
                }
                retArray.push(retObj);
            }
            return retArray;
        }

        $scope.saveReportExcelTable = function () {
            var wb = XLSX.utils.book_new();
            
            var wb = XLSX.utils.table_to_book(document.getElementById("logList"),{sheet:"메뉴별일자별"});
            var wbout = XLSX.write(wb, {bookType:'xlsx',  bookSST:true, type: 'binary'});

			function s2ab(s) {
				var buf = new ArrayBuffer(s.length);
				var view = new Uint8Array(buf);
				for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
			}

			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "Menu Report.xlsx");

        }

        $scope.saveReportExcel = function() {
            var wb = XLSX.utils.book_new();

            var searchStartDate = $("#searchStartDate").val();
            var searchEndDate = $("#searchEndDate").val();

            var Heading = [
                ["검색 기간", searchStartDate + " ~ " + searchEndDate]
            ];

            var logSearchExcel = new Object();
            //logSearchExcel.field = makeExcelField($scope.logSearchFields);
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
//# sourceURL=apps/datalog-kyochon/datalog-kyochon/datalog/report/pos_report_menu_1100.js