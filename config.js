app.config(function($stateProvider, $urlRouterProvider) {

  var path = {
    path: '^/datalog-kyochon/datalog-kyochon'
  };
  var absPath = {
    absPath: '/apps/datalog-kyochon/datalog-kyochon',
    idxPage: 'index.html'
  };


  function replace(str, keys) {
    return str.replace(/{[^{}]+}/g, function(key) {
      return keys[key.replace(/[{}]+/g, '')] || '';
    });
  }


  $stateProvider
    .state('pos', {
      url: replace('{path}/datalog/', path),
      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/kyochon_pos.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })
    .state('erp', {
      url: replace('{path}/datalog/', path),
      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/kyochon_erp.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })
    .state('prt', {
      url: replace('{path}/datalog/', path),

      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/pos_report.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })
    .state('ert', {
      url: replace('{path}/datalog/', path),

      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/erp_report.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })

    .state('prt.menu', {
      url: replace('{path}/datalog/report', path),

      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/report/pos_report_menu.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })

    .state('prt.menu1100', {
      url: replace('{path}/datalog/report', path),

      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/report/pos_report_menu_1100.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })

    .state('prt.path', {
      url: replace('{path}/datalog/report', path),

      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/report/pos_report_path.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })


    .state('ert.release', {
      url: replace('{path}/datalog/', path),

      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/report/erp_report_release.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })


    .state('tst', {
      url: replace('{path}/datalog/', path),

      views: {
        '': {
          templateUrl: replace('{absPath}/datalog/test.html', absPath)
        }
      },
      onExit: function() {
        console.log('onExit')
      }
    })

});


app.filter('prettyJSON', function() {
  function prettyPrintJson(json) {
    return JSON ? JSON.stringify(json, null, '  ') : 'your browser doesnt support JSON so cant pretty print';
  }
  return prettyPrintJson;
});


app.filter('cutString', function() {
  return function(item) {

    if (item != null) {
      var rtnVal = "";
      var aryStr = item.split(',');
      //log("aryStr", aryStr);

      if (aryStr.length > 3) {
        var etc = aryStr.length - 3;
        rtnVal = aryStr[0] + "," + aryStr[1] + "," + aryStr[2] + "... 외 " + etc + "건";
      } else
        rtnVal = item;

    }
    return rtnVal;
  };
});

app.filter('kcreport', function() {
  function getWeekStr(year, month, day){
    var weekArray = ["일","월","화","수","목","금","토"];
    var weekNum = new Date(year, month-1, day).getDay();
    return weekArray[weekNum];
  }
  return function(str) {
    var regExp = /^\d{4}-\d{2}-\d{2}-[cm]$/;
    if(regExp.test(str)) {
      var strArr = str.split("-");
      var typeStr = "수량";
      if(strArr[3]=="m") typeStr = "총액"
      // 20201230 Tltle 요일 추가
      // var weekStr = getWeekStr(strArr[0],strArr[1],strArr[2]);
      // return  strArr[0] + "-" + strArr[1] + "-" + strArr[2] + "(" + weekStr + ") - " + typeStr;
      return strArr[0] + "-" + strArr[1] + "-" + strArr[2] + "(" + typeStr + ")";
    }
    else return str;
  }
})

app.filter('kcrprate', function() {
  return function(val) {
    if (!angular.isNumber(val)) {
      return val;
    }
    return val.toFixed(2) + "%";
  }
})

app.filter('dateFormatter', function() {
  return function(item) {
    var rtnVal = "";

    if (item == null || item == "" || typeof item == "undefined") {
      rtnVal = "";
    } else {
      rtnVal = item.substr(0, 19);
    }

    return rtnVal;
  };
});

app.filter('duration', function() {
  //Returns duration from milliseconds in hh:mm:ss format.
  return function(millseconds) {
    var timeString = '';
    if (typeof(millseconds) == "undefined") {
      timeString = "백업완료";
    } else {
      var seconds = Math.floor(millseconds / 1000);
      var h = 3600;
      var m = 60;
      var hours = Math.floor(seconds / h);
      var minutes = Math.floor((seconds % h) / m);
      var scnds = Math.floor((seconds % m));

      if (scnds < 10) scnds = "0" + scnds;
      if (hours < 10) hours = "0" + hours;
      if (minutes < 10) minutes = "0" + minutes;
      timeString = hours + ":" + minutes + ":" + scnds;
    }
    return timeString;
  }
});

app.filter('chkuseyn', function() {
  return function(item) {

    if (item != null) {
      var rtnVal = "";

      if (item == "Y")
        rtnVal = "true";
    }
    return rtnVal;
  };
});

app.filter('chkNumber', function($filter) {
  return function(value, fractionSize) {
    if (!angular.isNumber(value)) {
      return value;
    }
    if(value==null ||value=="") value = 0;
    return $filter('number')(value, fractionSize);
  }
});

app.filter('chkNumberNull', function($filter) {
  return function(value, fractionSize) {
    if(value==null) return 0;
    if(value=="") value = 0;
    if (!angular.isNumber(value)) {
      return value;
    }
    return $filter('number')(value, fractionSize);
  }
});

app.filter('statNumber', function($filter) {
  return function(value) {
    if(typeof value === "undefined") return 0;
    if(value == null) return 0;

    if (!angular.isNumber(value)) {
      return value;
    }
    if (!value) return  0;

    var num = new Number(value);
    num = num.toFixed(2);
    num = parseFloat(num)

    var parts = num.toString().split(".");
    var retVal = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
    return retVal;
  }
});

// app.filter('statTestNumber', function($filter) {
//   return function(value) {
//     console.log("value", value);
//     if(typeof value === "undefined") return 0;
//
//     if (!angular.isNumber(value)) {
//       return value;
//     }
//     if (!value) return  0;
//     if(value=="") return  0;
//
//     var num = new Number(value);
//     num = num.toFixed(2);
//     num = parseFloat(num)
//
//     var parts = num.toString().split(".");
//     var retVal = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
//     return retVal;
//   }
// });

app.filter('statRate', function($filter) {
  return function(value) {
    if(typeof value === "undefined") return "0 %";
    if(value == null) return "0 %";
    if(value == "-Infinity") return "-100 %";

    if (!angular.isNumber(value)) {
      return value;
    }
    if (!value) return  0;
    var num = new Number(value);
    num = num.toFixed(2);
    num = parseFloat(num)

    var parts = num.toString().split(".");
    var retVal = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
    return retVal + " %";
  }
});

app.filter('Filesize', function() {
  return function(size) {
    if (isNaN(size))
      size = 0;
    if(size == null)
      size = 0;
    if(size == "null")
      size = 0;

    if (size < 1024)
      return size + ' Bytes';

    size /= 1024;

    if (size < 1024)
      return size.toFixed(2) + ' Kb';

    size /= 1024;

    if (size < 1024)
      return size.toFixed(2) + ' Mb';

    size /= 1024;

    if (size < 1024)
      return size.toFixed(2) + ' Gb';

    size /= 1024;

    return size.toFixed(2) + ' Tb';
  };
});


app.run(function($translatePartialLoader) {
  $translatePartialLoader.addPart('/apps/datalog-kyochon/datalog-kyochon/locales');
});

//# sourceURL=apps/datalog-kyochon/datalog-kyochon/config.js
