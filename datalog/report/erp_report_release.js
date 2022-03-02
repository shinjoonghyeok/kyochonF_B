(function() {
  app.register.controller('DatalogERPReleaseReportController', DatalogERPReleaseReportController);

  function DatalogERPReleaseReportController($scope, $q, $location, $http, socket, $filter, $state, $element, $window, $document, serviceLogdb, $stateParams, serviceSession, serviceAuth, USER_LEVELS, $interval, $timeout, $templateCache, filterFilter, serviceNotification, serviceLogdbManagement) {
    console.log(":: Report erp release Page ::");

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

    var releaseSearchInstance = null;
    var releaseStatusSearchQuery;

    var lookupSearchInstance = null;
    var lookupStatusSearchQuery;

    var startTimeStamp = "";
    var endTimeStamp = "";

    $scope.searchStartDate = getPastDate(1);
    $scope.searchEndDate = getPastDate(1);

    $scope.searchLimit = 0;
    $scope.logSearchPageSize = $scope.searchPage;

    $scope.nowDateArray = [];
    $scope.preDateArray = [];
    $scope.releaseSearchResult = new Array();

    var queryMaxCounter = 2000;

    $scope.tableReport = "MM_QTIO";
    $scope.lookupRelease = "KCERPRelease";

    $scope.detailRowField = [
      {key:"CD_ITEM", value:"품목"},
      {key:"itemName", value:"품목명"},
      {key:"classM", value:"중분류"},
      {key:"classS", value:"소분류"},
      {key:"dateTime", value:"출고일자"},
      {key:"sumQT", value:"출하수량"},
      {key:"weightEXC", value:"중량환산"},
      {key:"wingEXC", value:"날개환산"},
      {key:"legEXC", value:"북채환산"},
      {key:"sumAM", value:"금액"},
    ];

    function makeConfigRate(obj, sum) {
      var retObj = new Object();
      var rateObj = new Object();
      Object.keys(obj).forEach(function(key) {
        rateObj[key] = ( obj[key] / sum ) * 100;
      });
      retObj.val = obj;
      retObj.rate = rateObj;

      return retObj;
    }


    function makeReportScreen(arr) {
      console.log("arr", arr)
      var retVal = new Object();
      var summaryRowResult = new Array();

      var summaryNowSumResult = new Object();
      var summaryPreSumResult = new Object();

      var summaryNowDateResult = new Object();
      var summaryPreDateResult = new Object();

      summaryNowSumResult.cutmeat = 0;
      summaryNowSumResult.wing = 0;
      summaryNowSumResult.leg = 0;
      summaryNowSumResult.flesh = 0;
      summaryNowSumResult.etc1 = 0;
      summaryNowSumResult.etc2 = 0;

      summaryPreSumResult.cutmeat = 0;
      summaryPreSumResult.wing = 0;
      summaryPreSumResult.leg = 0;
      summaryPreSumResult.flesh = 0;
      summaryPreSumResult.etc1 = 0;
      summaryPreSumResult.etc2 = 0;

      for(var x=0; x<$scope.classMList.length; x++) {
        summaryNowDateResult[$scope.classMList[x]] = 0;
        summaryPreDateResult[$scope.classMList[x]] = 0;
      }

      var nowSum = 0;
      var preSum = 0;

      for(var i=0; i<arr.length; i++) {
        switch(arr[i].classS) {
          case ("날개"):
            if(arr[i].classM=="윙봉") {
              arr[i].weightEXC  = arr[i].sumQT * 1;
              arr[i].wingEXC    = arr[i].sumQT * 1.136364;
              arr[i].legEXC     = 0;
            }
            else {
              arr[i].weightEXC  = arr[i].sumQT * 1;
              arr[i].wingEXC    = arr[i].sumQT * 1;
              arr[i].legEXC     = 0;
            }
            if(arr[i].searchType=="now") summaryNowSumResult.wing = summaryNowSumResult.wing + arr[i].wingEXC;
            else summaryPreSumResult.wing = summaryPreSumResult.wing + arr[i].wingEXC;
          break;

          case ("북채"):
            arr[i].weightEXC  = arr[i].sumQT * 1;
            arr[i].wingEXC    = 0;
            arr[i].legEXC     = arr[i].sumQT * 1;

            if(arr[i].searchType=="now") summaryNowSumResult.leg = summaryNowSumResult.leg + arr[i].legEXC;
            else summaryPreSumResult.leg = summaryPreSumResult.leg + arr[i].legEXC;
          break;

          case ("허니콤보"):
            arr[i].weightEXC  = arr[i].sumQT * 1;
            arr[i].wingEXC    = arr[i].sumQT * 0.39;
            arr[i].legEXC     = arr[i].sumQT * 0.54;

            if(arr[i].searchType=="now") {
              summaryNowSumResult.wing = summaryNowSumResult.wing + arr[i].wingEXC;
              summaryNowSumResult.leg = summaryNowSumResult.leg + arr[i].legEXC;
            }
            else {
              summaryPreSumResult.wing = summaryPreSumResult.wing + arr[i].wingEXC;
              summaryPreSumResult.leg = summaryPreSumResult.leg + arr[i].legEXC;
            }
          break;

          case ("순살"):
            if(arr[i].classM=="순살정육" && arr[i].CD_ITEM=="A0082") {
              arr[i].weightEXC  = arr[i].sumQT * 0.35;
              arr[i].wingEXC    = 0;
              arr[i].legEXC     = 0;
            }
            else if(arr[i].classM=="순살정육" && arr[i].CD_ITEM=="A0066") {
              arr[i].weightEXC  = arr[i].sumQT * 0.7;
              arr[i].wingEXC    = 0;
              arr[i].legEXC     = 0;
            }
            else {
              arr[i].weightEXC  = arr[i].sumQT * 0.25;
              arr[i].wingEXC    = 0;
              arr[i].legEXC     = 0;
            }
            if(arr[i].searchType=="now") summaryNowSumResult.flesh = summaryNowSumResult.flesh + arr[i].weightEXC;
            else summaryPreSumResult.flesh = summaryPreSumResult.flesh + arr[i].weightEXC;
          break;

          case ("기타"):
            if(arr[i].classM=="살살정육" || arr[i].classM=="살살가슴살") {
              arr[i].weightEXC  = arr[i].sumQT * 0.2;
              arr[i].wingEXC    = 0;
              arr[i].legEXC     = 0;
            }
            else {
              arr[i].weightEXC  = arr[i].sumQT * 1;
              arr[i].wingEXC    = 0;
              arr[i].legEXC     = 0;
            }

            if(arr[i].searchType=="now") {
              if(arr[i].classL=="기타2") summaryNowSumResult.etc2 = summaryNowSumResult.etc2 + arr[i].weightEXC;
              else summaryNowSumResult.etc1 = summaryNowSumResult.etc1 + arr[i].weightEXC;
            }
            else {
              if(arr[i].classL=="기타2") summaryPreSumResult.etc2 = summaryPreSumResult.etc2 + arr[i].weightEXC;
              else summaryPreSumResult.etc1 = summaryPreSumResult.etc1 + arr[i].weightEXC;
            }
          break;

          case ("절단육"):
            arr[i].weightEXC  = arr[i].sumQT * 1;
            arr[i].wingEXC    = 0;
            arr[i].legEXC     = 0;
            if(arr[i].searchType=="now") summaryNowSumResult.cutmeat = summaryNowSumResult.cutmeat + arr[i].weightEXC;
            else summaryPreSumResult.cutmeat = summaryPreSumResult.cutmeat + arr[i].weightEXC;
          break;


          default:
            console.log("case default")
            arr[i].weightEXC  = arr[i].sumQT * 1;
            arr[i].wingEXC    = 0;
            arr[i].legEXC     = 0;
          break;
        }

        if(arr[i].searchType=="now") summaryRowResult.push(arr[i]);


        if(arr[i].searchType=="now") {
          summaryNowDateResult[arr[i].itemDetail] = summaryNowDateResult[arr[i].itemDetail] + arr[i].weightEXC;
          nowSum = nowSum + arr[i].weightEXC;
        }
        else {
          summaryPreDateResult[arr[i].itemDetail] = summaryPreDateResult[arr[i].itemDetail] + arr[i].weightEXC;
          preSum = preSum + arr[i].weightEXC;
        }
      }

      retVal.rowResult = summaryRowResult;
      retVal.sumNowResult = summaryNowSumResult;
      retVal.sumPreResult = summaryPreSumResult;

      retVal.dateNowResult = makeConfigRate(summaryNowDateResult, nowSum);
      retVal.datePreResult = makeConfigRate(summaryPreDateResult, preSum);
      // retVal.dateNowResult = summaryNowDateResult;
      // retVal.datePreResult = summaryPreDateResult;

      return retVal;
    }

    function makeInDeCreaseRate(now, pre, sArr) {
      var retArray = new Array();
      var retValObj = new Object();
      var retRateObj = new Object();
      var tnowsum = 0;
      var tpresum = 0;

      var snosum = 0;
      var spresum = 0;
      Object.keys(now).forEach(function(key) {
        if(typeof pre[key]==="undefined") pre[key] = 0;
        retValObj[key] = now[key] - pre[key];
        retRateObj[key] = ( retValObj[key] / now[key] ) * 100;
        tnowsum  = tnowsum + now[key];
        tpresum  = tpresum + pre[key];

        if(sArr.indexOf(key)!=-1) {
          snosum = snosum + now[key];
          spresum = spresum + pre[key];
        }
      })
      retRateObj.tsum = ( (tnowsum - tpresum) / tnowsum ) * 100;
      retRateObj.ssum = ( (snosum - spresum) / snosum ) * 100;

      retValObj.tsum = tnowsum - tpresum;
      retValObj.ssum = snosum - spresum;

      retArray.push(retValObj);
      retArray.push(retRateObj);

      return retArray;
    }


    $scope.searchTotalLog = function() {
      $scope.processTime = 0;

      startTimeStamp = new Date();
      $scope.tableWidth = $("#mainTable").width();

      if(releaseSearchInstance!=null) {
        console.log("already releaseSearchInstance exist query")
        serviceLogdb.remove(releaseSearchInstance);
      }

      var searchStartDate = $("#searchStartDate").val();
      var searchEndDate = $("#searchEndDate").val();
      $scope.searchStartDate = searchStartDate;
      $scope.searchEndDate = searchEndDate;

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

      var releaseQuery = " | search CLS_L == \"A\"";
      releaseQuery += " | eval dateTime = concat(substr(DT_IO,0,4), \"-\", substr(DT_IO,4,6), \"-\", substr(DT_IO,6,8))";
      releaseQuery += " | fields CD_ITEM, QT_IO, AM, dateTime";
      releaseQuery += " | stats sum(QT_IO) as sumQT, sum(AM) as sumAM  by dateTime, CD_ITEM";
      releaseQuery += " | lookup KCERPRelease CD_ITEM output itemName, itemDetail, classM, classS, classL";
      releaseQuery += " | eval itemName = if(isnull(itemName), \"기타2\", itemName)";
      releaseQuery += " | eval classL = if(isnull(classL), \"기타2\", classL)";
      releaseQuery += " | eval classM = if(isnull(classM), \"기타2\", classM)";
      releaseQuery += " | eval classS = if(isnull(classS), \"기타\", classS)";
      releaseQuery += " | eval itemDetail = if(isnull(itemDetail), \"기타2\", itemDetail)";
      releaseQuery += " | sort CD_ITEM, dateTime";
      releaseQuery += " | order CD_ITEM, itemName, classM, classS, dateTime, sumQT, sumAM";

      var addEndMoment = endMoment.add(1, "d").format("YYYY-MM-DD");
      var searchFromStrNow = "from=" + searchStartDate.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      var searchToStrNow = "to=" + addEndMoment.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";


      var searchStartDatePre = startMoment.add("-1", "y").format("YYYY-MM-DD");
      var searchEndDatePre = endMoment.add("-1", "y").format("YYYY-MM-DD");

      var searchFromStrPre = "from=" + searchStartDatePre.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";
      var searchToStrPre = "to=" + searchEndDatePre.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") + "000000";

      var mainNowQuery = new StringBuilder();
      var mainPreQuery = new StringBuilder();
      mainNowQuery.AppendFormat("table {0} {1} {2}", searchFromStrNow, searchToStrNow, $scope.tableReport);
      mainPreQuery.AppendFormat("table {0} {1} {2}", searchFromStrPre, searchToStrPre, $scope.tableReport);

      var finalQuery = new StringBuilder();
      finalQuery.AppendFormat("{0} {1} | eval searchType=\"now\" | union [ {2} {3} | eval searchType=\"pre\" ]", mainNowQuery.ToString(), releaseQuery, mainPreQuery.ToString(), releaseQuery)

      if($scope.$parent.uid=="root" || $scope.$parent.uid=="logpresso") {
        console.log("Final Query : " + finalQuery.ToString());
      }

      $scope.releaseSearchResult = new Array();

      $scope.btnFlag = "searching";
      loading(true, "logSearchPanel");

      releaseSearchInstance = serviceLogdb.create(pid);
      releaseSearchQuery = releaseSearchInstance.query(finalQuery.ToString(), queryMaxCounter);
      try {
        releaseSearchQuery
          .started(function() {
            console.log("release start")
          })
          .onHead(function() {})
          .onStatusChange(function() {})
          .onTail(function(h) {
            h.getResult(function(m) {
              console.log("release tail", m)
              var releaseResult = makeReportScreen(m.body.result);
              console.log(releaseResult)
              $scope.releaseSearchResult = releaseResult.rowResult;
              $scope.sumSearchNowResult = releaseResult.sumNowResult;
              $scope.sumSearchPreResult = releaseResult.sumPreResult;

              var ssumArray = ['leg','wing'];
              $scope.sumSearchRate = makeInDeCreaseRate(releaseResult.sumNowResult, releaseResult.sumPreResult, ssumArray);
              console.log($scope.sumSearchRate);

              $scope.dateNowSearchResult = releaseResult.dateNowResult;
              $scope.datePreSearchResult = releaseResult.datePreResult;
              $scope.$apply();
            });
          })
          .loaded(function() {
            console.log("release loaded")
            $scope.btnFlag = "ready";
            loading(false, "logSearchPanel");
          })
          .failed(function() {
            $scope.btnFlag = "ready";
            loading(false, "logSearchPanel");
          });

        serviceLogdb.remove(releaseSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    $scope.searchStop = function() {
      releaseSearchInstance.stop();

      loading(false, "logSearchPanel");
      $scope.btnFlag = "ready";
    }

    $scope.getTotalSummary = function(type) {
      var retVal = 0;
      if($scope.releaseSearchResult.length > 0) {
        var calTarget = null;
        switch(type) {
          case 'nowval':
            calTarget = $scope.dateNowSearchResult.val;
          break;
          case 'nowrate':
            calTarget = $scope.dateNowSearchResult.rate;
          break;
          case 'preval':
            calTarget = $scope.datePreSearchResult.val;
          break;
          case 'prerate':
            calTarget = $scope.datePreSearchResult.rate;
          break;
          default:
          break;
        }

        if(calTarget!=null) {
          for(var i=0; i<$scope.classMList.length; i++) {
            retVal = retVal + calTarget[$scope.classMList[i]];
          }
        }
      }

      return retVal;
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


    $scope.saveReportExcel1 = function() {
      let tbl1 = document.getElementById("reportExcel1")
      let tbl2 = document.getElementById("reportExcel2")

      let worksheet_tmp1 = XLSX.utils.table_to_sheet(tbl1);
      let worksheet_tmp2 = XLSX.utils.table_to_sheet(tbl2);

      let a = XLSX.utils.sheet_to_json(worksheet_tmp1, { header: 1 })
      let b = XLSX.utils.sheet_to_json(worksheet_tmp2, { header: 1 })

      a = a.concat(['']).concat(b)

      let worksheet = XLSX.utils.json_to_sheet(a, { skipHeader: true })

      const new_workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(new_workbook, worksheet, "worksheet")
      //XLSX.writeFile(new_workbook, 'tmp_file.xls')
      var wbout = XLSX.write(new_workbook, {bookType:'xlsx',  bookSST:true, type: 'binary'});

			function s2ab(s) {
				var buf = new ArrayBuffer(s.length);
				var view = new Uint8Array(buf);
				for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
			}

			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "Release Report.xlsx");
		}
    $scope.saveReportExcel = function() {
      var wb = XLSX.utils.book_new();

      let tbl1 = document.getElementById("reportExcel1")
      let tbl2 = document.getElementById("reportExcel2")

      let worksheet_tmp1 = XLSX.utils.table_to_sheet(tbl1);
      let worksheet_tmp2 = XLSX.utils.table_to_sheet(tbl2);

      XLSX.utils.book_append_sheet(wb, worksheet_tmp1, "summary1");
      XLSX.utils.book_append_sheet(wb, worksheet_tmp2, "summary2");

			var wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});

			/* generate a download */
			function s2ab(s) {
				var buf = new ArrayBuffer(s.length);
				var view = new Uint8Array(buf);
				for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
			}

			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "Release Report.xlsx");
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
      if(releaseSearchInstance!=null) {
        console.log("already releaseSearchInstance exist query")
        serviceLogdb.remove(releaseSearchInstance);
      }
      if(lookupSearchInstance!=null) {
        console.log("already lookupSearchInstance exist query")
        serviceLogdb.remove(lookupSearchInstance);
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


    function makeSearchStrField(array, field) {
      var retStr = "";
      for(var i=0; i<array.length; i++) {
        retStr += field + " == \"" + array[i].key + "\" or "
      }
      retStr = retStr.substr(0, retStr.length-3);
      return retStr;
    }


    function getLookupClassList() {
      if(lookupSearchInstance!=null) {
        serviceLogdb.remove(lookupSearchInstance);
      }
      $scope.pathFieldSearchResult = [];
      var runQuery = "lookuptable " + $scope.lookupRelease + " | eval groupNum = int(groupNum), sortNum = int(sortNum) | stats count by  classL, itemDetail, groupNum, sortNum | sort groupNum, sortNum | fields classL, itemDetail | join classL [ lookuptable KCERPRelease | eval groupNum = int(groupNum), sortNum = int(sortNum) | stats count by  classL, itemDetail, groupNum, sortNumlookuptable KCERPRelease | stats count by classL ]";
      console.log("runQuery", runQuery)

      lookupSearchInstance = serviceLogdb.create(pid);
      lookupSearchQuery = lookupSearchInstance.query(runQuery, queryMaxCounter);

      try {
        lookupSearchQuery
          .onTail(function(helper) {
            helper.getResult(function(m) {
              console.log("lookup tail", m)
              var result = m.body.result;
              var classL = "";
              $scope.classLList = new Array();
              $scope.classMList = new Array();
              for(var i=0; i<result.length; i++) {
                if(classL=="" || classL != result[i].classL) {
                  var inputObj = new Object();
                  inputObj.name = result[i].classL;
                  inputObj.length = result[i].count;
                  $scope.classLList.push(inputObj);
                }
                $scope.classMList.push(result[i].itemDetail)
                classL = result[i].classL;
              }
              console.log($scope.classMList)
              serviceLogdb.remove(lookupSearchInstance);
              $scope.$apply()
            })
          })
          .failed(function(m) {
            console.log("stat fail", m)
          });

        serviceLogdb.remove(lookupSearchInstance);
      } catch (e) {
        console.log(e);
      }
    }

    getLookupClassList();

  }
})();
//# sourceURL=apps/datalog-kyochon/datalog-kyochon/datalog/report/erp_report_release.js
