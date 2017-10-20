// !!! PARAMTERS TO BE INTRODUCED BY USER !!!!
//-------------------------------------------
const tag_name = 'mensfashion';
//-------------------------------------------
const P_POST_LIKES = 0; //100
const P_POST_COMMENTS = 0; //10
//-------------------------------------------
const P_ENG_RATE = 1.00; // Percent %
const P_AV_LIKES = 0; //1000
const P_AV_COMMENTS = 0; //10
//-------------------------------------------
const first = 8;
var   C_MAX_ITER = 10;
const X_FILE_SUFF = P_POST_LIKES + '_' + P_POST_COMMENTS + '_' + P_ENG_RATE + '%_' + P_AV_LIKES + '_' + P_AV_COMMENTS;
const C_OUT_DIR = './OUT';
const C_OUT_FILE = 'insta_' + X_FILE_SUFF + '.csv';
const C_OUT_FILE2 = C_OUT_DIR + '/' + C_OUT_FILE;
const Gurl = 'https://www.instagram.com/graphql/query/?query_id=17875800862117404';
//-------------------------------------------

var express = require('express');
var async = require('async');
var sleep = require('system-sleep');
var superagent = require('superagent');
var logger = require('superagent-logger');
var moment = require('moment-timezone');
var colors = require('colors');

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});


var dateFormat = require('dateformat');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var jsdom = require('jsdom');
const {
  JSDOM
} = jsdom;
var xpath = require('xpath'),
  dom = require('xmldom').DOMParser


function log_error(p_str) {
  console.log(String(p_str).error);
}

function log_info(p_str) {
  console.log(String(p_str).info);
}

function log_warn(p_str) {
  console.log(String(p_str).warn);
}

function log_data(p_str) {
  console.log(String(p_str).data);
}
//00000000000000000000000000000000000000000000000000000000000000000000000000000000000
function http_request_json(url, callback) {
  request(url, function(error, response, json) {
    if (!error) {
      var JsonObj = JSON.parse(json);
      //console.log(JSON.Stringify(json));
      callback(null, JsonObj, url);
    } else {
      callback(error);
    }
  });
}

function timestamp2date(n) {
  var time = moment(n * 1000).format("YYYY-MM-DD HH:mm:ss");
  return time;
}

function UserException(message) {
  this.message = message;
  this.name = "UserException";
}

function extractEmails(text) {
  try {
    if (typeof text == 'undefined') {
      return "";
    }
    //return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    var re = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    var email = text.match(re);
    //console.log(email[0]);
    if (email != null) {
      email = email[0];
    }
    return email;
  } catch (e) {
    log_error('extractEmails :#' + e);
    return null;
  }
}

function extractKik(text) {
  try {
    if (typeof text == 'undefined') {
      return "";
    }
    var re = /([kK][iI][kK][:])(\s+)(\w+)(\W)/gi;
    var kik = text.match(re);
    //console.log('kik = '+kik);
    kik = String(kik).replace(re, "$3");
    //console.log('kik = '+kik);
    return kik;
  } catch (e) {
    log_error('extractKik :#' + e);
    return null;
  }
}

function eng_rate_is_good(eng_rate, base) {
  var eng_rate_n = Number(String(eng_rate).replace("%", ""));

  if (eng_rate_n >= base) {
    return true
  };
  return false;
}

function clean_number(p_str) {
  var v_str = String(p_str).replace("%", "");
  v_str = String(v_str).replace(/[a-zA-Z,]/gmi, "");
  //log_error('clean_number  :  '+p_str+' -->'+v_str);
  return v_str;
}

function post_likes_ok(post_likes, base) {
  var post_likes_n = Number(clean_number(post_likes));
  //log_error('post_likes_ok '+post_likes_n+' '+base);
  if (post_likes_n >= base) {
    return true
  };
  return false;
}

function post_comments_ok(post_comments, base) {
  var post_comments_n = Number(clean_number(post_comments));
  //log_error('post_comments_ok '+post_comments_n+' '+base);
  if (post_comments_n >= base) {
    return true
  };
  return false;
}

function av_likes_ok(av_likes, base) {
  var av_likes_n = Number(clean_number(av_likes));
  //log_error('av_likes_ok '+av_likes_n+' '+base+'    :'+av_likes);
  if (av_likes_n >= base) {
    return true
  };
  return false;
}

function av_comments_ok(av_comments, base) {
  var av_comments_n = Number(clean_number(av_comments));
  //log_error('av_comments_ok '+av_comments_n+' '+base);
  if (av_comments_n >= base) {
    return true
  };
  return false;
}

function clean_description(p_str) {

  var v_str = String(p_str).replace(/[\"]/gmi, "");
  //log_error('clean_number  :  '+p_str+' -->'+v_str);
  return v_str;
}


function SaveDataToFile(DataLine_x, callback) {
  var fs = require('fs');
  const dlm = ';'; // text delimiter
  const ti = '"'; //text indicator
  var lg = DataLine_x.username + ' ' +
    DataLine_x.shortcode + ' ' +
    DataLine_x.likes_nbr + ' ' +
    DataLine_x.comments_nbr + ' ' +
    DataLine_x.phl_eng_rate + ' ' +
    clean_number(DataLine_x.phl_av_likes) + ' ' +
    clean_number(DataLine_x.phl_av_comments);
  var w_line = '';
  if ((DataLine_x.url == 'url') || (
      (post_likes_ok(DataLine_x.likes_nbr, P_POST_LIKES) == true) &&
      (post_comments_ok(DataLine_x.comments_nbr, P_POST_COMMENTS) == true) &&
      (eng_rate_is_good(DataLine_x.phl_eng_rate, P_ENG_RATE) == true) &&
      (av_likes_ok(DataLine_x.phl_av_likes, P_AV_LIKES) == true) &&
      (av_comments_ok(DataLine_x.phl_av_comments, P_AV_COMMENTS) == true)
    )) {
    log_info(lg);

    w_line += ti + DataLine_x.url + ti + dlm;
    w_line += ti + DataLine_x.owner_id + ti + dlm;
    w_line += ti + DataLine_x.username + ti + dlm;
    w_line += ti + DataLine_x.tag + ti + dlm;

    w_line += ti + DataLine_x.shortcode + ti + dlm;
    w_line += ti + DataLine_x.likes_nbr + ti + dlm;
    w_line += ti + DataLine_x.comments_nbr + ti + dlm;

    w_line += ti + DataLine_x.phl_eng_rate + ti + dlm;
    w_line += ti + DataLine_x.phl_av_likes + ti + dlm;
    w_line += ti + DataLine_x.phl_av_comments + ti + dlm;

    w_line += ti + (clean_description(DataLine_x.binfo_description) || "-") + ti + dlm;
    w_line += ti + (DataLine_x.binfo_email || "-") + ti + dlm;
    w_line += ti + (DataLine_x.binfo_kik || "-") + ti + dlm;
    w_line += ti + (DataLine_x.binfo_website || "-") + ti + dlm;
    w_line += ti + DataLine_x.binfo_followers + ti + dlm;
    w_line += ti + DataLine_x.binfo_following + ti + dlm;
    w_line += ti + DataLine_x.binfo_nbr_of_posts + ti + dlm;

    w_line += ti + DataLine_x.location + ti + dlm;
    w_line += ti + DataLine_x.posting_time + ti + dlm;

    w_line += '\n';
    fs.appendFile(C_OUT_FILE2, w_line, function(err) {
      if (err) {
        return console.log(err);
      }

      //console.log("The file was saved!");
    });
  } else {
    log_warn('Rej: ' + lg);
  }

}


function JSON_parse(obj) {
  try {
    return JSON.parse(obj);
  } catch (e) {
    log_error('function JSON_parse');
    log_error(e);
    log_error(obj);
  }

}

function findProp(obj, prop, defval) {
  //obj =JSON.parse(obj);
  //log_info('---> function findProp  : ' + prop);
  //log_info('obj = '+JSON.stringify(obj));
  if (typeof defval == 'undefined') defval = "";
  prop = prop.split('.');
  for (var i = 0; i < prop.length; i++) {
    if (obj == null) return defval;
    if (typeof obj[prop[i]] == 'undefined')
      return defval;
    obj = obj[prop[i]];
  }
  return obj;
}

function loadScriptFromURL(url) {
  var request = Components.classes['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Components.interfaces.nsIXMLHttpRequest),
    async = false;
  request.open('GET', url, async);
  request.send();
  if (request.status !== 200) {
    var message = 'an error occurred while loading script at url: ' + url + ', status: ' + request.status;
    iimDisplay(message);
    return false;
  }
  eval(request.response);
  return true;
}


function urlConstruct(base, tag_name, first, after) {
  //base Gurl ='https://www.instagram.com/graphql/query/?query_id=17875800862117404'
  //var headings = document.evaluate('//h2', document, null, XPathResult.ANY_TYPE, null );

  return base + '&variables={"tag_name":"' + tag_name + '","first":' + first + ',"after":"' + after + '"}';

}


//var url ='https://www.instagram.com/graphql/query/?query_id=17875800862117404&variables={"tag_name":"morocco","first":10,"after":"J0HWd-wzwAAAF0HWd-sAgAAAFjgA"}' ;
//var url ='https://www.instagram.com/graphql/query/?query_id=17875800862117404&variables={"tag_name":"morocco","first":7,"after":"J0HWd_gCAAAAF0HWd_fcQAAAFiYA"}'  ;






function SendHttpRequestHTML(url) {
  superagent.get(url)
    .set('Accept', "text/html")
    .set('async', "false")
    .set('jsonpCallback', "callback")
    .end(function(err, res) {
      if (err || !res.ok) {
        log_error('SendHttpRequestHTML Error');
        log_error('err=' + err);
        log_error(res.body);
      } else {
        return (JSON.stringify(res.body));
      }
    });
}

function ctrl_initial_url() {
  var url = window.content.document.location.href;

  if (url.indexOf("https://www.instagram.com/explore/tags/") > -1) {
    //log_error('Good Url   !!');
  } else {
    err_msg = "Bad URL , must be like https://www.instagram.com/explore/tags/{{tag}}/";
    log_error(err_msg);
    throw new UserException(err_msg);
  }
}



function initial_url() {
  //return window.content.document.location.href+'?__a=1';
  var url = "https://www.instagram.com/explore/tags/" + tag_name + "/?__a=1";
  return url;
}

function getElementByXpath(path, document) {
  //return window.content.document.evaluate(path, window.content.document, null, XPathResult.ANY_TYPE, null).singleNodeValue;
  //FIRST_ORDERED_NODE_TYPE	9
  return document.evaluate(path, document, null, 9, null).singleNodeValue;
}




var DataLine = function() {
  return {
    end_cursor: "",
    url: "",
    owner_id: "",
    username: "",
    tag: "",
    shortcode: "",
    likes_nbr: "",
    comments_nbr: "",
    phl_eng_rate: "",
    phl_av_likes: "",
    phl_av_comments: "",
    binfo_description: "",
    binfo_email: "",
    binfo_kik: "",
    binfo_website: "",
    binfo_followers: "",
    binfo_following: "",
    binfo_nbr_of_posts: "",
    location: "",
    posting_time: "",
  };
};
var phlanxRec = function() {
  var username = '';
  var eng_rate = 0;
  var av_likes = 0;
  var av_comments = 0;

  return {
    username: username,
    eng_rate: eng_rate,
    av_likes: av_likes,
    av_comments: av_comments
  };
};

var bioInfo = function() {
  return {
    description: "",
    email: "",
    kik: "",
    website: "",
    followers: "",
    following: "",
    nbr_of_posts: ""
  };
}



function DOM(string) {
  //var {Cc, Ci} = require("chrome");
  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
  return (parser.parseFromString(string, "text/html"));
};


function ShortCode2Username(DataLine_x, callback) {
  //log_info('---> function ShortCode2Username');
  //log_info(DataLine_x.owner_id);
  var url = 'https://www.instagram.com/p/' + DataLine_x.shortcode + '/?__a=1';

  http_request_json(url,
    function(err, Json) {
      if (err) callback(err);
      var username = findProp(Json, 'graphql.shortcode_media.owner.username');
      var location = findProp(Json, 'graphql.shortcode_media.location.name');
      var posting_time = findProp(Json, 'graphql.shortcode_media.taken_at_timestamp');
      DataLine_x.username = username;
      DataLine_x.location = location;
      DataLine_x.posting_time = "'" + timestamp2date(posting_time) + "'";
      callback(null, DataLine_x);
    })
}

function phlanx_info(DataLine_x, callback) {
  var w_user_name = DataLine_x.username;
  var url = 'https://phlanx.com/engagement-calculator?insta=' + w_user_name
  //log_info('---> function phlanx_info');
  //log_info('   onwer_id=' + DataLine_x.owner_id);
  //--------------------------------------
  request(url, function(error, response, html) {
    if (!error) {
      var json = {
        username: "",
        eng_rate: "",
        av_likes: "",
        av_comments: ""
      };
      var w_eng_rate, w_av_likes, w_av_comments;

      const dom = new JSDOM(html);
      w_eng_rate = dom.window.document.querySelector("#main-site > div.info-container > h4").textContent;
      w_av_likes = dom.window.document.querySelector("#main-site > div.interaction-count > div > div.likes").textContent;
      w_av_comments = dom.window.document.querySelector("#main-site > div.interaction-count > div > div.comm").textContent;
      //console.log('w_eng_rate ='+w_eng_rate);
      DataLine_x.phl_eng_rate = w_eng_rate;
      DataLine_x.phl_av_likes = w_av_likes;
      DataLine_x.phl_av_comments = w_av_comments;
      callback(null, DataLine_x);
    }
  });
  //.......................................


}


function bio_info(DataLine_x, callback) {
  //log_info('---> function bio_info');
  //log_info('   onwer_id=' + DataLine_x.owner_id);
  var w_user_name = DataLine_x.username;
  var url = 'https://www.instagram.com/' + w_user_name + '/?__a=1';

  request(url, function(error, response, json) {
    if (!error) {
      var JsonObj = JSON.parse(json);
      DataLine_x.binfo_description = findProp(JsonObj, 'user.biography');
      DataLine_x.binfo_website = findProp(JsonObj, 'user.external_url');
      DataLine_x.binfo_followers = findProp(JsonObj, 'user.followed_by.count');
      DataLine_x.binfo_following = findProp(JsonObj, 'user.follows.count');
      DataLine_x.binfo_nbr_of_posts = findProp(JsonObj, 'user.media.count');

      //********************************
      DataLine_x.binfo_email = extractEmails(DataLine_x.description);
      DataLine_x.binfo_kik = extractKik(DataLine_x.description);
      //********************************
      callback(null, DataLine_x);
    }

  })
  //*************
  // log_error('   username='+DataLine_x.username);
  // log_error('   phl_eng_rate='+DataLine_x.phl_eng_rate);
  // log_error('   phl_av_likes='+DataLine_x.phl_av_likes);
  // log_error('   phl_av_comments='+DataLine_x.phl_av_comments);

}

function nodesnTabSaveUnit(DataLine_x, callback) {
  //console.log('---> function nodesnTabSaveUnit: Start');
  owner_id = DataLine_x.owner_id;
  shortcode = DataLine_x.shortcode;
  comments_nbr = DataLine_x.comments_nbr;
  likes_nbr = DataLine_x.likes_nbr;
  log_error(' comments_nbr:' + comments_nbr + ' likes_nbr:' + likes_nbr);

  if ((post_likes_ok(likes_nbr, P_POST_LIKES) == true) &&
    (post_comments_ok(comments_nbr, P_POST_COMMENTS) == true)
  ) {
    async.waterfall([
      async.apply(ShortCode2Username, DataLine_x),
      phlanx_info,
      bio_info,
      SaveDataToFile,
    ], function(error, Data) {
      if (!error) {
        //log_info('---> function nodesnTabSaveUnit: End');
        //callback(null,DataLine_x);
      } else {
        log_error('Error nodesnTabSaveUnit :' + error);
      }
    });

  }
}
//...........
function nodesnTabSave(nodesnTab, url0, tag_name0, callback) {
  console.log('---> function nodesnTabSave');
  // (I/II) SaveData nodesnTab
  for (var i = 0; i < nodesnTab.length; i++) {
    var DataLine_x = DataLine();
    DataLine_x.url = url0;
    DataLine_x.tag = tag_name0;
    DataLine_x.owner_id = findProp(nodesnTab[i], 'owner.id');
    DataLine_x.shortcode = findProp(nodesnTab[i], 'code');
    DataLine_x.comments_nbr = findProp(nodesnTab[i], 'comments.count');
    DataLine_x.likes_nbr = findProp(nodesnTab[i], 'likes.count');
    //nodesnTabSaveUnit(DataLine_x);
    async.waterfall([
      async.apply(nodesnTabSaveUnit, DataLine_x),
    ], function(error, data) {
      if (!error) {
        callback(null, data);
      } else {
        callback(error);
      }
    });
  }
}




//...........
//---------------------------
//0
//---------------------------
function init(callback) {
  callback(null, initial_url());
}



function trt1(GJson0, url0, callback) {
  var end_cursor = findProp(GJson0, 'tag.media.page_info.end_cursor');
  var tag_name = findProp(GJson0, 'tag.name');
  var nodes1Tab = findProp(GJson0, 'tag.media.nodes');
  var nodes2Tab = findProp(GJson0, 'tag.top_posts.nodes');
  log_warn('trt1 --> end_cursor=' + end_cursor);
  do_job2(end_cursor, C_MAX_ITER);
  // (I) SaveData nodes1Tab
  //nodesnTabSave(nodes1Tab);
  // (II) SaveData nodes1Tab
  //nodesnTabSave(nodes2Tab);
  //sequence
  async.waterfall([
    async.apply(nodesnTabSave, nodes1Tab, url0, tag_name),
    async.apply(nodesnTabSave, nodes2Tab, url0, tag_name),
  ], function(error, result) {
    if (!error) {
      callback(null, end_cursor);
    } else {
      callback(error);
    }
  });

}


function save_File_header() {
  // test if file exists
  var file_exists = false;
  fs.stat(C_OUT_FILE2, function(err, stat) {
    if (err == null) {
      console.log('save_File_header : file exists ');
    } else if (err.code == 'ENOENT') {
      // file does not exist
      //--------------------------
      DataLine_x = DataLine();
      DataLine_x.url = 'url';
      DataLine_x.owner_id = 'owner_id';
      DataLine_x.username = 'username';
      DataLine_x.tag = 'tag';
      DataLine_x.shortcode = 'shortcode';
      DataLine_x.likes_nbr = 'likes_nbr';
      DataLine_x.comments_nbr = 'comments_nbr';
      DataLine_x.phl_eng_rate = 'phl_eng_rate';
      DataLine_x.phl_av_likes = 'phl_av_likes';
      DataLine_x.phl_av_comments = 'phl_av_comments';
      DataLine_x.binfo_description = 'binfo_description';
      DataLine_x.binfo_email = 'binfo_email';
      DataLine_x.binfo_kik = 'binfo_kik';
      DataLine_x.binfo_website = 'binfo_website';
      DataLine_x.binfo_followers = 'binfo_followers';
      DataLine_x.binfo_following = 'binfo_following';
      DataLine_x.binfo_nbr_of_posts = 'binfo_nbr_of_posts';
      DataLine_x.location = 'location';
      DataLine_x.posting_time = 'posting_time';
      SaveDataToFile(DataLine_x);
      //--------------------------
    } else {
      console.log('save_File_header: ', err.code);
    }
  });
  //

}

function do_job2(end_cursor, x_iter) {



  var end_cursor_l = end_cursor;
  //var url = urlConstruct(Gurl, tag_name, first, end_cursor_l);
  if (x_iter <= 0) return;
  //SaveData('end_cursor:'+ end_cursor ,'end_cursor.txt');
  var url = urlConstruct(Gurl, tag_name, first, end_cursor_l);
  //----------------------------------
  request(url, function(error, response, json) {
    if (!error) {
      var GJson = JSON.parse(json);
      end_cursor_l = findProp(GJson, 'data.hashtag.edge_hashtag_to_media.page_info.end_cursor');
      EdgeTab = findProp(GJson, 'data.hashtag.edge_hashtag_to_media.edges');
      //------------------------
      //SaveData(EdgeTab.length,'end_cursor.txt');
      for (var i = 0; i < EdgeTab.length; i++) {
        owner_id = findProp(EdgeTab[i], 'node.owner.id');
        shortcode = findProp(EdgeTab[i], 'node.shortcode');
        comments_nbr = findProp(EdgeTab[i], 'node.edge_media_to_comment.count');
        likes_nbr = findProp(EdgeTab[i], 'node.edge_liked_by.count');
        //log_data('New ::::::::  end_cursor_l = '+end_cursor_l +' iter='+x_iter+' '+'  '+ owner_id);
        log_data('New ::::::::  end_cursor_l = ' + end_cursor_l + ' iter=' + x_iter + ' ' + '  ' + owner_id);
        //-----------------------------
        DataLine_x = DataLine();
        DataLine_x.url = url;
        DataLine_x.owner_id = owner_id;
        DataLine_x.tag = tag_name;
        DataLine_x.shortcode = shortcode;
        DataLine_x.likes_nbr = likes_nbr;
        DataLine_x.comments_nbr = comments_nbr;
        sleep(1000); // 2 seconds
        async.waterfall([
          async.apply(nodesnTabSaveUnit, DataLine_x),
        ], function(error, data) {
          if (!error) {
            callback(null, data);
          } else {
            callback(error);
          }
        });
        //-----------------------------

      }
      do_job2(end_cursor_l, x_iter - 1);
      //------------------------
      //callback(null, DataLine_x);
    }
  });

}


function do_job() {

  var tag = tag_name;
  var Gurl0 = initial_url();
  //file header
  save_File_header();

  //sequence
  async.waterfall([
    init,
    http_request_json,
    trt1,
  ], function(err, result) {
    // result now equals 'done'
    console.log('fin do_job() :' + result);
  });





}

//00000000000000000000000000000000000000000000000000000000000000000000000000000000000


app.get('/posts', function(req, res) {

  var w_name = req.query.name;

  log_info('debut...');
  do_job();
  log_info('FIN...');
  res.send('job submited...');
})


app.get('/top9', function(req, res) {

  var w_name = req.query.name;
  var w_time = req.query.time;
  if (w_time == 'undefined') {w_time=20};
  log_info('debut...');
  var html ='<br>job submited...';
      html+='<br>usage : http://ip:port/top10?name={name}&time={time}'
  res.send(html);
  w_time = w_time*1000;
  for(var i=0;i<10;i++){
    log_info('############### '+i+' ##################');
	C_MAX_ITER=0;
	do_job();
	sleep(w_time);
	
	}
})

app.listen('8080')
console.log('Magic happens on port 8080');
exports = module.exports = app;
