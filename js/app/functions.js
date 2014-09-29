// Give IE the ability to bind objects to functions
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

function constrainNumber(number, min, max) {
  if (number > max) {return max;}
  else if (number < min) {return min;}
  else {return number;}
} 

// To bind a function to an event
var addEvent = function(elem, type, eventHandle) {
    if (elem == null || typeof(elem) == 'undefined') return;
    if ( elem.addEventListener ) {
        elem.addEventListener( type, eventHandle, false );
    } else if ( elem.attachEvent ) {
        elem.attachEvent( "on" + type, eventHandle );
    } else {
        elem["on"+type]=eventHandle;
    }
};

function getWindowSize() {
    var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) -10;
    return {w:width, h:height};
}

function getDivSize(name) {
  var w = document.getElementById(name).clientWidth
  return w;
}

function sign(x) {
  if(isNaN(x)) {
    return NaN;
  } else if(x === 0) {
    return x;
  } else {
    return (x > 0 ? 1 : -1);
  }
}


function getData(online, path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        if (httpRequest.status === 200) {
          var data = JSON.parse(httpRequest.responseText);
          callback(data);
        } else {
          console.log("Loading " +path+ " failed");
        }
      }
    };
    httpRequest.open('GET', path);
    httpRequest.send();
  
}

function eventFire(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement, fromIndex) {
    var k;
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (len === 0) {
      return -1;
    }
    var n = +fromIndex || 0;
    if (Math.abs(n) === Infinity) {
      n = 0;
    }
    if (n >= len) {
      return -1;
    }
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (k in O && O[k] === searchElement) {
        return k;
      }
      k++;
    }
    return -1;
  };
}

function formatNumber (num) {
    console.log(num)
    console.log(num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, " "))
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, " ")
}

function areSiblings(f1, f2) {
  if (f1.si && f2.si) {
    var sib = false;
    var len = f1.si.length;
    while(len--) {
      if (f1.si[len] === f2.id) {sib = true; break;}
    }
    return sib;
  } else {
    return false;
  }
}

function thousandSeparator(n, sep)
{
    var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})'),
        sValue = n + '';
    if(sep === undefined)
    {
        sep = ',';
    }
    while(sRegExp.test(sValue))
    {
        sValue = sValue.replace(sRegExp, '$1' + sep + '$2');
    }
    return sValue;
}

//Optional parameter includeMargin is used when calculating outer dimensions
(function($) {
$.fn.getHiddenDimensions = function(includeMargin) {
    var $item = this,
        props = { position: 'absolute', visibility: 'hidden', display: 'block' },
        dim = { width:0, height:0, innerWidth: 0, innerHeight: 0,outerWidth: 0,outerHeight: 0 },
        $hiddenParents = $item.parents().andSelf().not(':visible'),
        includeMargin = (includeMargin == null)? false : includeMargin;

    var oldProps = [];
    $hiddenParents.each(function() {
        var old = {};

        for ( var name in props ) {
            old[ name ] = this.style[ name ];
            this.style[ name ] = props[ name ];
        }

        oldProps.push(old);
    });

    dim.width = $item.width();
    dim.outerWidth = $item.outerWidth(includeMargin);
    dim.innerWidth = $item.innerWidth();
    dim.height = $item.height();
    dim.innerHeight = $item.innerHeight();
    dim.outerHeight = $item.outerHeight(includeMargin);

    $hiddenParents.each(function(i) {
        var old = oldProps[i];
        for ( var name in props ) {
            this.style[ name ] = old[ name ];
        }
    });

    return dim;
}
}(jQuery));

function darkenColor(color, ratio) {
    var col_rgb = Raphael.getRGB(color);
    var col_hsl = Raphael.rgb2hsl(col_rgb.r, col_rgb.g, col_rgb.b);
    var col = Raphael.hsl(col_hsl.h, Math.min(col_hsl.s*0.9, 0.8), ratio);
    return col;
}

function desaturateColor(color, ratio) {
    var col_rgb = Raphael.getRGB(color);
    var col_hsl = Raphael.rgb2hsl(col_rgb.r, col_rgb.g, col_rgb.b);
    var col = Raphael.hsl(col_hsl.h, col_hsl.s*ratio, col_hsl.l);
    return col;
}