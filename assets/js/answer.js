function createGUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

function replaceAll(str, searchStr, replaceStr) {
  return str.split(searchStr).join(replaceStr);
}

function answerPad(str, length) {
  var retStr = "";
  for (var i = 0; i < length; i++) {
    retStr += str;
  }

  return retStr;
}

function arrayPush(str, length) {
  var retArray = new Array();
  for (var i = 0; i < length; i++) {
    retArray.push(str);
  }
  //console.log("answer", retArray);
  return retArray;
}

function hexToRGBA(hex, opacity) {
  //console.log(hex);
  return 'rgba(' + (hex = hex.replace('#', '')).match(new RegExp('(.{' + hex.length / 3 + '})', 'g')).map(function(l) {
    return parseInt(hex.length % 2 ? l + l : l, 16)
  }).concat(opacity).join(',') + ')';
}

function getNowDateTime() {
  var date = new Date();
  var year = date.getFullYear();
  var month = new String(date.getMonth() + 1);
  var day = new String(date.getDate());

  var hour = new String(date.getHours());
  var minute = new String(date.getMinutes());
  var second = new String(date.getSeconds());


  if (month.length == 1) month = "0" + month;
  if (day.length == 1) day = "0" + day;

  if (hour.length == 1) hour = "0" + hour;
  if (minute.length == 1) minute = "0" + minute;
  if (second.length == 1) second = "0" + second;

  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

function getPastDate(date) {
  var date = new Date(new Date().setDate(new Date().getDate() - date));
  var year = date.getFullYear();
  var month = new String(date.getMonth() + 1);
  var day = new String(date.getDate());

  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }

  return year + "-" + month + "-" + day;
}


function getNowDate() {
  var date = new Date();
  var year = date.getFullYear();
  var month = new String(date.getMonth() + 1);
  var day = new String(date.getDate());

  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }

  return year + "-" + month + "-" + day;
}

function getNowDateFormat() {
  var date = new Date();
  var year = date.getFullYear();
  var month = new String(date.getMonth() + 1);
  var day = new String(date.getDate());

  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }

  return year + "" + month + "" + day;
}

function getNowDateTimeStart() {
  var date = new Date();
  var year = date.getFullYear();
  var month = new String(date.getMonth() + 1);
  var day = new String(date.getDate());

  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }

  return year + "-" + month + "-" + day + " 00:00:00";
}

function getNowDateTimeEnd() {
  var date = new Date();
  var year = date.getFullYear();
  var month = new String(date.getMonth() + 1);
  var day = new String(date.getDate());

  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }

  return year + "-" + month + "-" + day + " 23:59:59";
}

function showRuleFactor(factor) {
  var retVal = "";
  if (factor == "high") retVal = "높음";
  else if (factor == "mid") retVal = "중간";
  else retVal = "낮음";

  return retVal;
}

function checkCronTab(str) {
  var checkPattern = /^(\*|(0?[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))/;
  var retVal = false;

  if (str.search(/\s/) != -1) {
    retVal = checkPattern.test(str);
  } else {
    retVal = false;
  }

  return retVal;
}

function byteConvertor(bytes) {
  bytes = parseInt(bytes);
  var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  var e = Math.floor(Math.log(bytes) / Math.log(1024));
  if (e == "-Infinity") return "0 " + s[0];
  else return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
}

function arrayUnique(array) {
  var a = array.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j])
        a.splice(j--, 1);
    }
  }
  return a;
}

function arraySum(array) {
  var result = 0.0;

  for (var i = 0; i < array.length; i++)
    result += parseInt(array[i]);

  return result;
}



function isRange(index, val) {
  var checkVal = undefined,
    type = undefined,
    checkExc = undefined;

  var cronPattern1 = /,|-/g;
  var cronPattern2 = /,|-|\*|\//g;
  var exceptionString = /\*\/0/g;

  if (cronPattern2.test(val)) { //	cron 표현식 들어있으면

    var newVal1 = val.split(cronPattern1);

    var splitedBy2 = val.split(cronPattern2);
    var newVal2 = splitedBy2.filter(function(d) {
      return (d != '');
    });

    switch (index) {
      case 0:
        checkExc = newVal1.every(function(d) {
          return exceptionString.test(d);
        });
        checkVal = newVal2.every(function(d) {
          return (d >= 0 && d < 60);
        });
        type = 'minute';
        break;
      case 1:
        checkExc = newVal1.every(function(d) {
          return exceptionString.test(d);
        });
        checkVal = newVal2.every(function(d) {
          return (d >= 0 && d < 24);
        });
        type = 'hour';
        break;
      case 2:
        checkExc = newVal1.every(function(d) {
          return exceptionString.test(d);
        });
        checkVal = newVal2.every(function(d) {
          return (d > 0 && d < 32);
        });
        type = 'day';
        break;
      case 3:
        checkExc = newVal1.every(function(d) {
          return exceptionString.test(d);
        });
        checkVal = newVal2.every(function(d) {
          return (d > 0 && d < 13);
        });
        type = 'month'
        break;
      case 4:
        checkExc = newVal1.every(function(d) {
          return exceptionString.test(d);
        });
        checkVal = newVal2.every(function(d) {
          return (d >= 0 && d < 7);
        });
        type = 'week';
        break;
    }
  } else { // 표현식 없이 값만 있다면
    switch (index) {
      case 0:
        checkExc = exceptionString.test(val);
        checkVal = (val >= 0 && val < 60) ? true : false;
        type = 'minute';
        break;
      case 1:
        checkExc = exceptionString.test(val);
        checkVal = (val >= 0 && val < 24) ? true : false;
        type = 'hour';
        break;
      case 2:
        checkExc = exceptionString.test(val);
        checkVal = (val > 0 && val < 32) ? true : false;
        type = 'day';
        break;
      case 3:
        checkExc = exceptionString.test(val);
        checkVal = (val > 0 && val < 13) ? true : false;
        type = 'month'
        break;
      case 4:
        checkExc = exceptionString.test(val);
        checkVal = (val >= 0 && val < 7) ? true : false;
        type = 'week'
        break;
    }
  }

  return {
    isExceptionString: checkExc,
    isValOutOfRange: checkVal,
    type: type
  }
}

function isValidateCronSchedule(arr) {
  var checkValid = [],
    type = undefined;

  for (var i = 0; i < arr.length; i++) {
    if (arr[i] != '*') { //	every로 설정되어 있지 않다면 validation 검사
      var checkRange = isRange(i, arr[i]);
      var isValid = false,
        isNumOutOfRange = false;

      if (checkRange.isValOutOfRange && !checkRange.isExceptionString) {
        isValid = true;
      } else if (!checkRange.isValOutOfRange) {
        isNumOutOfRange = true;
      }

      checkValid.push({
        num: arr[i],
        type: checkRange.type,
        isNumValid: isValid,
        isNumOutOfRange: isNumOutOfRange,
        isExceptionString: checkRange.isExceptionString
      });
    }
  }

  return {
    isAllValid: checkValid.every(function(d) {
      return d.isNumValid || d.isNumExceptionString;
    }),
    checkValid: checkValid
  }
}

var Base64 = {
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  encode: function(input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {

      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

    }

    return output;
  },

  decode: function(input) {
    if (typeof input == 'undefined') {
      return "";
    }

    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }

    }

    output = Base64._utf8_decode(output);

    return output;

  },

  _utf8_encode: function(string) {
    if(string!="") {
      //if(string!=" ") {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

          var c = string.charCodeAt(n);

          if (c < 128) {
            utftext += String.fromCharCode(c);
          } else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          } else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }
        }
      //}
      //else {
      //  var utftext = " ";
      //}
    }
    else {
      var utftext = "";
    }

    return utftext;
  },

  _utf8_decode: function(utftext) {
    if(utftext!="") {
      //if(utftext!=" ") {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

          c = utftext.charCodeAt(i);

          if (c < 128) {
            string += String.fromCharCode(c);
            i++;
          } else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
          } else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
          }
        }
      //}
      //else {
      //  var string = " ";
      //}
    }
    else {
      var string = "";
    }

    return string;
  }
}

function formatDateTimeString(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear(),
    hour = d.getHours(),
    minute = d.getMinutes(),
    second = d.getSeconds();


  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  if (hour < 10) hour = '0' + hour;
  if (minute < 10) minute = '0' + minute;
  if (second < 10) second = '0' + second;

  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

function formatDateTime(date, division) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear(),
    hour = d.getHours().zf(2),
    minute = d.getMinutes().zf(2),
    second = d.getSeconds().zf(2);


  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day, hour, minute, second].join(division);
}

// String Builder
var StringBuilder = function() {
  this.buffer = new Array();
}
//순서대로 문자열을 추가한다.
StringBuilder.prototype.Append = function(strValue) {
  this.buffer[this.buffer.length] = strValue;
  // this.buffer.push( strValue ); //IE5.5 NS4
}
// 문자열의 형식을 지정해서 추가한다.
StringBuilder.prototype.AppendFormat = function() {
  var count = arguments.length;
  if (count < 2) return "";
  var strValue = arguments[0];
  for (var i = 1; i < count; i++)
    strValue = strValue.replace("{" + (i - 1) + "}", arguments[i]);
  this.buffer[this.buffer.length] = strValue;
}
// 해당하는 위치에 문자열을 추가한다. (문자위치가 아님);
StringBuilder.prototype.Insert = function(idx, strValue) {
  this.buffer.splice(idx, 0, strValue); //IE5.5 NS4
}
// 해당문자열을 새로운 문자열로 바꾼다.
// (배열방 단위로 바꾸므로 배열방 사이에 낀 문자열은 바꾸지 않음)
StringBuilder.prototype.Replace = function(from, to) {
  for (var i = this.buffer.length - 1; i >= 0; i--)
    this.buffer[i] = this.buffer[i].replace(new RegExp(from, "g"), to); //IE4  NS3
}
// 문자열로 반환한다.
StringBuilder.prototype.ToString = function() {
  return this.buffer.join(""); //IE4 NS3
}


var _LOGFLAG = true;

$.fn.serializeObject = function() {
  "use strict";

  var result = {};
  var extend = function(i, element) {
    var node = result[element.name];

    // If node with same name exists already, need to convert it to an array as it
    // is a multi-value field (i.e., checkboxes)

    if ('undefined' !== typeof node && node !== null) {
      if ($.isArray(node)) {
        node.push(element.value);
      } else {
        result[element.name] = [node, element.value];
      }
    } else {
      result[element.name] = element.value;
    }
  };

  $.each(this.serializeArray(), extend);
  return result;
};

var _PAGEX = 0;
var _PAGEY = 0;
$(document).mousemove(function(e) {
  var _PAGEX = e.pageX;
  var _PAGEY = e.pageY;
});


String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}


/*************************************************************************************
 * Log 찍기
 * @param msg : message (string)
 * @param para : param
 *************************************************************************************/
if (window.console == undefined) {
  console = {
    log: function() {}
  };
}

function log(msg, para) {
  //_LOGFLAG = $("#_LOGFLAG").val();

  if (_LOGFLAG == true || _LOGFLAG == "true") {
    if (para)
      if (typeof para == "object") para = JSON.stringify(para);
      else if (typeof msg == "object") msg = JSON.stringify(msg);
    if (para) console.debug(msg + ' ==>> ' + para);
    else console.log(msg);
  }
}


/*************************************************************************************
 * mode 화면에 로딩 표시
 * @param mode true, false
 * @param divID 메인화면이아닌 지정 DIV에 표시
 * @return 로딩 show, hide
 *************************************************************************************/
function loading(mode, divID) {
  var loadingID = document.getElementById('loadingIconId');
  if (divID) loadingID = document.getElementById(divID + 'loadingIconId');
  var loadingIDHTML;
  if (!loadingID) {
    if (divID) {
      loadingIDHTML = '<div id="' + divID + 'loadingIconId" style="position:absolute;top:48%;left:45%;display:none; margin:10px; text-align:center;z-index: 99999;">';
      loadingIDHTML += '<img src="' + loader_gif_path + '"><p>잠시만 기다려 주세요.</p></div>';
      $("#" + divID).append(loadingIDHTML);
    } else {
      loadingIDHTML = '<div id="loadingIconId" style="position:absolute;top:50%;left:45%;display:none; margin:10px; text-align:center;z-index: 99999;">';
      loadingIDHTML += '<img src="' + loader_gif_path + '"></div>';
      $(document.body).append(loadingIDHTML);
    }
  }

  if (mode) {
    if (divID) {
      $("#" + divID + "loadingIconId").show();
    } else $("#loadingIconId").show();
  } else {
    if (divID) {
      setTimeout(function() {
        $("#" + divID + "loadingIconId").hide();
      }, 500);
    } else setTimeout(function() {
      $("#loadingIconId").hide();
    }, 500);
  }
}


function answerTestLoading(str) {
  //console.log("Test Start : " + str);

}


function sysLoading(mode, divID) {

  var imgPath = "images/loader/spinner9.gif";
  //var imgPath = "images/loader/loader1.gif";
  var loadingIDHTML;
  var loadingID = document.getElementById('loadingIconId');

  if (divID) loadingID = document.getElementById(divID + 'loadingIconId');

  if (!loadingID) {
    if (divID) {
      loadingIDHTML = '<div id="' + divID + 'loadingIconId" style="position:absolute;top:0;right:0;display:none; margin:10px; text-align:center;z-index: 99999;">';
      loadingIDHTML += '<img src="' + imgPath + '"></div>';
      $("#" + divID).append(loadingIDHTML);
    } else {
      loadingIDHTML = '<div id="loadingIconId" style="position:absolute;top:50%;left:45%;display:none; margin:10px; text-align:center;z-index: 99999;">';
      loadingIDHTML += '<img src="' + imgPath + '"></div>';
      $(document.body).append(loadingIDHTML);
    }
  }

  if (mode) {
    if (divID) {
      $("#" + divID + "loadingIconId").show();
    } else
      $("#loadingIconId").show();
  } else {
    if (divID) {
      setTimeout(function() {
        $("#" + divID + "loadingIconId").hide();
      }, 500);
    } else
      setTimeout(function() {
        $("#loadingIconId").hide();
      }, 500);
  }
}


function cf_comma(num) {
  var len, point, str;

  num = num + "";
  point = num.length % 3;
  len = num.length;

  str = num.substring(0, point);
  while (point < len) {
    if (str != "") str += ",";
    str += num.substring(point, point + 3);
    point += 3;
  }

  return str;

}

function cf_rexComma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function cf_b64EnUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}

function cf_b64DeUnicode(str) {
  str = cf_nullChkString(str);
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

function cf_guid() {
  return cf_s4() + cf_s4() + '-' + cf_s4() + '-' + cf_s4() + '-' + new Date().valueOf() + '-' + cf_s4();
}

function cf_fiss_guid() {
  return cf_s4() + cf_s4() + '-' + cf_s4() + '-' + new Date().valueOf();
}

function cf_s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function cf_replaceAll(str, searchStr, replaceStr) {
  return str.split(searchStr).join(replaceStr);
}

function cf_DateToString(dateFormat, dateStr) {
  var todayDate = new Date();

  if (dateStr)
    todayDate = new Date(dateStr);

  var rtnStr = todayDate.format(dateFormat);
  return rtnStr;
}

function cf_nullCheckString(chkStr) {
  var rtnString = "";

  if (chkStr == null || chkStr == "" || typeof chkStr == "undefined" || chkStr == "null") {
    rtnString = "";
  } else {
    rtnString = chkStr.trim();
  }

  return rtnString;
}

function cf_nullChkString(chkStr) {
  var rtnString = "";

  if (chkStr == null || chkStr == "" || typeof chkStr == "undefined" || chkStr == "null") {
    rtnString = "";
  } else {
    rtnString = chkStr;
  }

  return rtnString;
}

function cf_nullChkStringToSpace(chkStr) {
  var rtnString = " ";

  if (chkStr == null || chkStr == "" || typeof chkStr == "undefined" || chkStr == "null") {
    rtnString = " ";
  } else {
    rtnString = chkStr;
  }

  return rtnString;
}

function cf_nullChkInt(chkStr) {
  var rtnString = "";

  if (chkStr == null || chkStr == "" || typeof chkStr == "undefined" || chkStr == "null") {
    rtnString = 0;
  } else {
    if (isNaN(chkStr) == true)
      rtnString = 0;
    else
      rtnString = chkStr;
  }

  return rtnString;
}


function cf_getAryDataCheck(aryData) {
  //log("aryData", aryData);
  var rtnVal = [];

  if (aryData == null || aryData == "" || typeof aryData == "undefined") {
    rtnVal = [];
  } else
    rtnVal = aryData;

  return rtnVal;
}

function cf_makeLimit(limitData) {
  var rtnLimit = limitData;

  if (rtnLimit == null || rtnLimit == "" || typeof rtnLimit == "undefined" || rtnLimit == "null") {
    rtnLimit = 0;
  }

  return rtnLimit;
}

function cf_makeUserAddInput(useYN, queries) {

  var rtnQuery = "";

  if (useYN == "Close") {
    rtnQuery = queries;
  }

  return rtnQuery;
}


/*************************************************************************************
 * cf_resizeGridWidth
 * @param gridID : grid table ID
 * @param widthVal : change Width
 * @return none
 *************************************************************************************/
function cf_resizeGridWidth(gridID, widthVal) {
  $(window).bind('resize', function() {
    $("#" + gridID).setGridWidth(widthVal);
  }).trigger('resize');
}

function msToTime(s) {
  // Pad to 2 or 3 digits, default is 2
  var pad = (n, z = 2) => ('00' + n).slice(-z);
  return pad(s / 3.6e6 | 0) + ':' + pad((s % 3.6e6) / 6e4 | 0) + ':' + pad((s % 6e4) / 1000 | 0) + '.' + pad(s % 1000, 3);
}



function swap(json) {
  var ret = {};
  for (var key in json) {
    ret[json[key]] = key;
  }
  return ret;
}

function createRandomNumber(start, end) {
  var x = Math.floor((Math.random() * end) + start);

  return x;
}

function createRandomString(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function checkRegistID(id, prefix, minLength, maxLength) {
  //console.log(id);
  if (typeof id == 'undefined') {
    return "[" + prefix + "] ID 값을 입력해 주세요."
  }
  if (id == "") {
    return "[" + prefix + "] ID 값을 입력해 주세요."
  }

  if (id.length < minLength || id.length > maxLength) {
    return "[" + prefix + "] 자리수는 " + minLength + "~" + maxLength + " 자리여야 합니다.";
  }

  //id = id.trim();
  var check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

  if (check.test(id)) {
    return "[" + prefix + "] 입력값에 한글은 사용할 수 없습니다.";
  }

  var spaceCheck = /\s/;
  if (spaceCheck.test(id)) {
    return "[" + prefix + "] 입력값에 공백이 있습니다.";
  }

  var charCheck = /^[A-Za-z0-9_\-+]*$/;
  if (!charCheck.test(id)) {
    return "[" + prefix + "] 입력값에 허용되지 않는 문자가 있습니다.(영어, 숫자, '_', '-' 로 구성)";
  }

  return "success";
}


function getUniqueObjectArray(array, key) {
  var tempArray = [];
  var resultArray = [];
  for (var i = 0; i < array.length; i++) {
    var item = array[i]
    if (tempArray.includes(item[key])) {
      continue;
    } else {
      resultArray.push(item);
      tempArray.push(item[key]);
    }
  }
  return resultArray;
}

function checkUniqueObjectArray(array, key) {
  var tempArray = [];
  var retFlag = false;

  for (var i = 0; i < array.length; i++) {
    var item = array[i]
    if (tempArray.includes(item[key])) {
      retFlag = true;
      break;
    } else {
      tempArray.push(item[key]);
    }
  }
  return retFlag;
}

function checkUniqueArray(array) {
  var valuesSoFar = [];
  var falseLine = 0;
  for (var i = 0; i < array.length; ++i) {
    var value = array[i].toLowerCase();
    if (valuesSoFar.indexOf(value) !== -1) {
      return true;
    }
    valuesSoFar.push(value);
  }
  return false;
}

function makeID(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


function jsonParseStringCheck(str) {
  str = str.replace(/\\n/ig, "\\n")
          .replace(/\\'/ig, "\\'")
          .replace(/\\"/ig, '\\"')
          .replace(/\\&/ig, "\\&")
          .replace(/\\r/ig, "\\r")
          .replace(/\\t/ig, "\\t")
          .replace(/\\b/ig, "\\b")
          .replace(/\\f/ig, "\\f")
          .replace(/[\u0000-\u0019]+/ig,"");
  return str;
}



function comparerArrayObject(otherArray){
  return function(current){
    return otherArray.filter(function(other){
      //return other.key == current.key && other.display == current.display
      return other.key == current.key
    }).length == 0;
  }
}

function divResize(divName, reheight, rewidth) {
  //console.log(divName, reheight, rewidth);
  var vHeight = $(window).height() - reheight,
  vWidth = $(window).width() - rewidth,
  cover = $('.' + divName);
  cover.css({"height":vHeight,"width":vWidth});
}

function divResizeArray(divName, reheight, rewidth, counter) {
  //console.log(divName, reheight, rewidth);
  var vHeight = $(window).height() - reheight,
  vWidth = $(window).width() - rewidth,
  cover = $($('.' + divName)[counter]);
  cover.css({"height":vHeight,"width":vWidth});
}
function array_diff(a, b) {
  var tmp={}, res=[];
  for(var i=0;i<a.length;i++) tmp[a[i]]=1;
  for(var i=0;i<b.length;i++) { if(tmp[b[i]]) delete tmp[b[i]]; }
  for(var k in tmp) res.push(k);
  return res;
}
function union(a, b) {
  var tmp={}, res=[];
  for(var i=0;i<a.length;i++) tmp[a[i]]=1;
  for(var i=0;i<b.length;i++) tmp[b[i]]=1;
  for(var k in tmp) res.push(k);
  return res;
}
function intersect(a, b) {
  var tmp={}, res=[];
  for(var i=0;i<a.length;i++) tmp[a[i]]=1;
  for(var i=0;i<b.length;i++) if(tmp[b[i]]) res.push(b[i]);
  return res;
}
function sym_diff(a, b) {
  var tmp={}, res=[];
  for(var i=0;i<a.length;i++) tmp[a[i]]=1;
  for(var i=0;i<b.length;i++) { if(tmp[b[i]]) delete tmp[b[i]]; else tmp[b[i]]=1; }
  for(var k in tmp) res.push(k);
  return res;
}

function SummerizeTable(table, fieldArray) {
  $(table).each(function() {
    $(table).find('td').each(function() {
      var $this = $(this);
      var col = $this.index();
      if(col==0) {
        var html = $this.html();
        var row = $(this).parent()[0].rowIndex;
        var span = 1;
        var cell_above = $($this.parent().prev().children()[col]);

        // look for cells one above another with the same text
        while (cell_above.html() === html) { // if the text is the same
          span += 1; // increase the span
          cell_above_old = cell_above; // store this cell
          cell_above = $(cell_above.parent().prev().children()[col]); // and go to the next cell above
        }

        // if there are at least two columns with the same value,
        // set a new span to the first and hide the other
        if (span > 1) {
          // console.log(span);
          $(cell_above_old).attr('rowspan', span);
          $this.hide();
        }
      }

    });
  });
}

function sortObject(o) {
  var sorted = {},
  key, a = [];

  for (key in o) {
    if (o.hasOwnProperty(key)) a.push(key);
  }
  a.sort().reverse();
  for (key=0; key<a.length; key++) {
    sorted[a[key]] = o[a[key]];
  }
  return sorted;
}
