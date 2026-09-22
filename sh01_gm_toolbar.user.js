// ==UserScript==
// @name         sh01_gm_toolbar
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  SH01-GM-页面工具
// @author       dong.luo@happyelements.com
// @include      /^http[s]*:\/\/.*\.happyelements\.net\/royal.*$/
// @include      /^http[s]*:\/\/.*\.sh-zero-one\.com.*$/
// @include      /^http[s]*:\/\/.*localhost.*$/
// @include      /^http[s]*:\/\/.*127\.0\.0\.1.*$/
// @require      https://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js
// @grant        none
// ==/UserScript==


(function() {
  'use strict';

  //==========================================
  // var $ = window.jQuery;
  var $ = window.jQuery.noConflict(true);

  // 时间戳转换成时间
  handlerTimestampShow();

  // 时间戳转换成时间
  function handlerTimestampShow() {
    var pageUrl = window.location.pathname;
    if (pageUrl.indexOf("/newUserData/getUserData.action") == -1
        && pageUrl.indexOf("/bean/getData.action") == -1
        && pageUrl.indexOf("/userMatch/getUserData.action") == -1) {
      return;
    }

    // 插入样式
    appendToolbar();

    const timerId = setInterval(function(){
      $(".number", $("#pre_json_show")).each(function() {
        // 一个节点只处理一次
        var transFlag = $(this).attr('transFlag');
        if (transFlag == "1") {
          return;
        }
        $(this).attr('transFlag', '1'); // 设置已处理标识
        clearInterval(timerId);

        // 尝试将数字转换成时间戳
        var dateInfo = timestampFormat($(this).html());
        if (dateInfo) {
          $(this).after(dateInfo);
        }
      });
    }, 100);
  }
  function timestampFormat(timeInfo) {
    if (!timeInfo) {
      return "";
    }
    if (/[^\d]/.test(timeInfo)) {
      return "";
    }

    if (timeInfo.length == 5 && timeInfo >= 18262 && timeInfo <= 29220) {
      // 格式一：第N天
      // 18262  2020-01-01 00:00:00
      // 29220  2050-01-01 00:00:00
      timeInfo = timeInfo * 24 * 60 * 60 * 1000 - 28800000;

    }else if(timeInfo.length == 10 && timeInfo >= 1577808000 && timeInfo <= 2524579200) {
      // 格式二：时间戳（单位秒）
      // 1577808000 2020-01-01 00:00:00
      // 2524579200 2050-01-01 00:00:00
      timeInfo = timeInfo * 1000;
    }

    // 时间戳检查
    if (timeInfo < 1577808000000 || timeInfo > 2524579200000) {
      return "";
    }

    var dateInfo = timestampToTime(timeInfo);
    if (!dateInfo) {
      return "";
    }
    return ',<span style="padding-left:20px; color: #0366d6;">// '+dateInfo+'</span>';
  }
  function timestampToTime(timestamp) { // 毫秒 1533773345000
    const dateObj = new Date(+timestamp); // ps, 必须是数字类型，不能是字符串, +运算符把字符串转化为数字，更兼容
    const year = dateObj.getFullYear(); // 获取年，
    const month = pad(dateObj.getMonth() + 1); // 获取月，必须要加1，因为月份是从0开始计算的
    const date = pad(dateObj.getDate()); // 获取日，记得区分getDay()方法是获取星期几的。
    const hours = pad(dateObj.getHours()); // 获取时, pad函数用来补0
    const minutes = pad(dateObj.getMinutes()); // 获取分
    const seconds = pad(dateObj.getSeconds()); // 获取秒
    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
  }
  function pad(str) {
    return +str >= 10 ? str : '0' + str
  }


  function appendToolbar() {
    var td = $("#originJsonData").parent("td");
    var oldHtmlCode = td.html();
    var jsonString = $("#originJsonData").val();
    td.html(genToolbarHtmlCode());

    var jsonObj = $.parseJSON(jsonString);
    var formattedJson = JSON.stringify(jsonObj, undefined, 2);
    $("#pre_json_show").html(syntaxHighlight(formattedJson));
    $("#div_json_edit").html(oldHtmlCode);


    $("#a_json_show").click(function (){
      $("#div_json_show").css({"display":"block"});
      $("#div_json_edit, #setUserData_0").css({"display":"none"});
      return false;
    });
    $("#a_json_edit").click(function (){
      $("#div_json_show").css({"display":"none"});
      $("#div_json_edit, #setUserData_0").css({"display":"block"});
      return false;
    });

    $("#a_json_show").click();
  }

  function genToolbarHtmlCode() {
    var htmlCode = '<style>\n' +
        '.ld-toolbar .string {color: green;}\n' +
        '.ld-toolbar .number {color: darkorange;}\n' +
        '.ld-toolbar .boolean {color: blue;}\n' +
        '.ld-toolbar .null {color: magenta;}\n' +
        '.ld-toolbar .key {color: red;}\n' +
        '.ld-toolbar .nav{height: 30px; line-height: 100%; font-size: 16px;}\n' +
        '.ld-toolbar .nav a{padding:0 20px 30px 0;}\n' +
        '.ld-toolbar #pre_json_show{font-family: Monaco, Menlo, Consolas, "Courier New", monospace; line-height: 140%;}\n' +
        '</style>\n' +
        '<div class="ld-toolbar">\n' +
        '  <div class="nav"><a id="a_json_show" href="#">查看</a><a id="a_json_edit" href="#">编辑</a></div>\n' +
        '  <div id="div_json_show" style="display:block;"><pre id="pre_json_show"></pre></div>\n' +
        '  <div id="div_json_edit" style="display:none;"></div>\n' +
        '</div>';
    return htmlCode;
  }

  function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function(match) {
          var cls = 'number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'key';
            } else if(/^"(\d+)"$/.test(match)) {
              cls = 'number';
              match = getCleanValue(match);

            } else if (/^"true|false"$/.test(match)) {
              cls = 'boolean';
              match = getCleanValue(match);

            } else {
              cls = 'string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'boolean';
          } else if (/null/.test(match)) {
            cls = 'null';
          }
          return '<span class="' + cls + '">' + match
              + '</span>';
        });
  }

  // 输入"abc"返回abc
  function getCleanValue(str) {
    const m = str.match(/^"([^"]+)"$/);
    if (m) {
      str = m[1];
    }
    return str;
  }

})();