(function (window, $) {

if ( ! window.Hub ) window.Hub = {};

var MostLiked = window.Hub.MostLiked = function MostLiked (opts) {

	var self = this;
	this.el = opts.el;
	this.$el = $(opts.el);
	this.network = opts.network;
	this.template = opts.template || MostLiked.template;
	this.commentTemplate = opts.commentTemplate || MostLiked.commentTemplate;
    this.count = opts.count;

	var reqXhr = MostLiked.request(opts);
	reqXhr.success(function (resp) {
		var counted = 0,
            $comments = self.$el.find('.hub-MostLiked'),
            data = resp.data,
			states = data.content,
            sortedStates = states.sort(function (i, j) {
                // descending order
                var iCount = i.content.annotations.likes,
                    jCount = j.content.annotations.likes;
                return jCount - iCount;
            }),
			authors = data.authors;
		$(sortedStates).each(function (index, state) {
            if (self.count && ( counted >= self.count)) {
                return;
            }
            counted++;
			var content = state.content,
                author = authors[content.authorId];
            
            content.author = author;
            var formattedDate = formatDate(new Date(content.createdAt*1000));
			$comments.append($(
				self.commentTemplate
                    .replace('{{ author.avatarUrl }}', content.author.avatar)
                    .replace('{{ author.id }}', content.author.id)
                    .replace('{{ author.userId }}', (content.author.id && content.author.id.split('@')[0]) )
                    .replace('{{ createdAt }}', formattedDate)
                    .replace('{{ id }}', content.id)
                    .replace('{{ author.displayName }}', content.author.displayName)
					.replace('{{ bodyHtml }}', content.bodyHtml)
                    .replace('{{ likeCount }}', content.annotations.likes)
                    .replace('{{ likeWord }}', likeWord(content.annotations.likes))
			));
		});
    
        function likeWord (likes) {
            return (likes==1) ? 'like' : 'likes';
        }
        
        function formatDate (d) {
            var relative = relativeTime({
                then: d
            });
            return relative;
        }
	});

	return this;
};

MostLiked.request = function (opts) {
	var url = 'http://bootstrap.{{ network }}/api/v3.0/site/{{ siteId }}/article/{{ b64ArticleId }}/top/likes/'
		.replace('{{ network }}', opts.network)
		.replace('{{ siteId }}', opts.siteId)
		.replace('{{ b64ArticleId }}', base64url(opts.articleId)),
		jqXhr = $.get(url);

	return jqXhr;

	function base64url (s) {
		var b64 = Base64.encode(s);
		return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
	}
};

MostLiked.prototype.render = function () {
	this.$el.html(this.template);
};

MostLiked.template = '<div class="hub-MostLiked"></div>';

MostLiked.commentTemplate = '\
<article data-hub-content-id="">\
<p class="hub-byline">{{ author.displayName }} - {{ likeCount }}</p>\
<div class="hub-content-body">{{ bodyHtml }}</div>\
</article>';

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
var Base64 = {
    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
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

            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode : function (input) {
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

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }
};

var relativeTime = (function () {

    var _ = function (options) {
        var opts = processOptions(options);

        var now = opts.now || new Date();
        var delta = now - opts.then;
        var future = (delta <= 0);
        delta = Math.abs(delta);

        // special cases controlled by options
        if (delta <= opts.nowThreshold) {
          return future ? 'Right now' : 'Just now';
        }
        if (opts.smartDays && delta <= 6 * MS_IN_DAY) {
          return toSmartDays(this, now);
        }

        var units = null;
        for (var key in CONVERSIONS) {
          if (delta < CONVERSIONS[key])
            break;
          units = key; // keeps track of the selected key over the iteration
          delta = delta / CONVERSIONS[key];
        }

        // pluralize a unit when the difference is greater than 1.
        delta = Math.floor(delta);
        //if (delta !== 1) { units += "s"; }
        return [delta, units, future ? " from now" : " ago"].join("");
  };

  function processOptions (arg) {
    if (!arg) arg = 0;
    if (typeof arg === 'string') {
      arg = parseInt(arg, 10);
    }
    if (typeof arg === 'number') {
      if (isNaN(arg)) arg = 0;
      return {nowThreshold: arg};
    }
    return arg;
  };

  function toSmartDays (date, now) {
    var day;
    var weekday = date.getDay(),
        dayDiff = weekday - now.getDay();
    if (dayDiff == 0)       day = 'Today';
    else if (dayDiff == -1) day = 'Yesterday';
    else if (dayDiff == 1 && date > now)  day = 'Tomorrow';
    else                    day = WEEKDAYS[weekday];
    return day + " at " + date.toLocaleTimeString();
  };

  var CONVERSIONS = {
    millisecond: 1, // ms    -> ms
    s: 1000,   // ms    -> sec
    m: 60,     // sec   -> min
    h:   60,     // min   -> hour
    d:    24,     // hour  -> day
    month:  30,     // day   -> month (roughly)
    year:   12      // month -> year
  };
  var MS_IN_DAY = (CONVERSIONS.millisecond * CONVERSIONS.s * CONVERSIONS.m * CONVERSIONS.h * CONVERSIONS.d);

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return _;

}());

}(this, jQuery));
