var utils = (function() {

  function getWindowSize() {
    var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) -10;
    return {w:width, h:height};
  }

  function darkenColor(color, ratio) {
    var col_rgb = Raphael.getRGB(color);
    var col_hsl = Raphael.rgb2hsl(col_rgb.r, col_rgb.g, col_rgb.b);
    var col = Raphael.hsl(col_hsl.h, Math.min(col_hsl.s*0.9, 0.8), ratio);
    return col;
  }

  function formatVolume(n, sep) {

    // Parse
    if (typeof n == 'string' || n instanceof String) {
      n = parseInt(n.replace(/\s+/g, ''));
    }

    // Round
    var round = n;
    if (round > 99) { round = Math.round(n/10)*10; }

    // Separate thousands
    var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})'),
    sValue = round + '';
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

  function constrainNumber(number, min, max) {
    if (number > max) {return max;}
    else if (number < min) {return min;}
    else {return number;}
  }

  function mergeSort(arr, compareFn) {
    if (arr == null) {
      return [];
    } else if (arr.length < 2) {
      return arr;
    }

    if (compareFn == null) {
      compareFn = defaultCompare;
    }

    var mid, left, right;

    mid   = ~~(arr.length / 2);
    left  = mergeSort( arr.slice(0, mid), compareFn );
    right = mergeSort( arr.slice(mid, arr.length), compareFn );

    return merge(left, right, compareFn);
  }

  function defaultCompare(a, b) {
    return a < b ? -1 : (a > b? 1 : 0);
  }

  function merge(left, right, compareFn) {
    var result = [];

    while (left.length && right.length) {
      if (compareFn(left[0], right[0]) <= 0) {
        result.push(left.shift());
      } else {
        result.push(right.shift());
      }
    }

    if (left.length) {
      result.push.apply(result, left);
    }

    if (right.length) {
      result.push.apply(result, right);
    }

    return result;
  }

  function formatString(s) {
    return s.toLowerCase()
            .replace(/[èéêë]/g, "e")
            .replace(/[ç]/g, "c")
            .replace(/[àâä]/g, "a")
            .replace(/[ïî]/g, "i")
            .replace(/[ûùü]/g, "u")
            .replace(/[ôöó]/g, "o");
  }

  return {getWindowSize:getWindowSize,
          darkenColor:darkenColor,
          formatVolume:formatVolume,
          constrainNumber:constrainNumber,
          mergeSort:mergeSort,
          formatString:formatString}

})()


  Math.sign = Math.sign || function sign(x) {
    if(isNaN(x)) {
      return NaN;
    } else if(x === 0) {
      return x;
    } else {
      return (x > 0 ? 1 : -1);
    }
  }