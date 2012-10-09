(function() {

var trim = function(s) {
  return s.replace(/(^\s*)|(\s*$)/g, '');
};

var queryAttr = function(q) {
  var chunker = /^([^!<>=\s]+)\s*([!<>=]{0,2})\s*(\w*)$/g;
  var split = chunker.exec(trim(q));
  var attr = split[1];
  var operator = split[2];
  var value = split[3];
  if (value == "true" || value == "false") {
    value = !!value;
  } else if (/[0-9.-]/.test(value)) {
    value = parseFloat(value);
  }
  if (!operator) {
    return function(input) {
      return input[attr];
    };
  } else {
    switch (operator) {

      case "=":
      case "==":
        return function(input) {
          return input[attr] && input[attr] == value;
        }
      break;

      case ">":
        return function(input) {
          return input[attr] && input[attr] > value;
        }
      break;

      case ">=":
        return function(input) {
          return input[attr] && input[attr] >= value;
        }
      break;

      case "<":
        return function(input) {
          return input[attr] && input[attr] < value;
        }
      break;

      case "<=":
        return function(input) {
          return input[attr] && input[attr] <= value;
        }
      break;

      case "!=":
      case "!":
        return function(input) {
          return input[attr] != value;
        }
      break;
    }
  }
}

var QueryUnit = function(collection) {
  collection = collection || [];
  for (var i = 0; i < collection.length; i++) {
    this[i] = collection[i];
  }
  this.length = collection.length;
};
QueryUnit.prototype = {
  length: 0,
  over: null,
  toArray: function() {
    return Array.prototype.slice.call(this);
  },
  when: function() {
    var args = Array.prototype.slice.call(arguments);

    var queries = [];
    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] == 'function') {
        queries.push(args[i]);
      } else if (typeof args[i] == 'string') {
        var split = args[i].split(',');
        for (var j = 0; j < split.length; j++) {
          if (split[j]) queries.push(queryAttr(split[j]));
        }
      }
    }

    var filtered = [];
    for (var i = 0; i < this.length; i++) {
      var matches = true;
      for (var j = 0; j < queries.length; j++) {
        var q = queries[j];
        if (!q(this[i])) {
          matches = false;
        }
      }
      if (matches) filtered.push(this[i]);
    }

    return new QueryUnit(filtered);
  },
  map: function(f) {
    var mapped = this.toArray().map(f);
    return new QueryUnit(mapped);
  },
  each: function(f) {
    for (var i = 0; i < this.length; i++) {
      f(this[i], i);
    }
  },
  traverse: function(prop) {
    var mapped = this.toArray().map(function(item) {
      return item[prop];
    });
    return new QueryUnit(mapped);
  },
  set: function(prop, value) {
    for (var i = 0; i < this.length; i++) {
      this[i][prop] = value;
    }
    return this;
  },
  get: function(prop) {
    return this.toArray().map(function(item) {
      return item[prop];
    });
  },
  byType: function(T) {
    var filtered = [];
    for (var i = 0; i < this.length; i++) {
      if (this[i] instanceof T) filtered.push(this[i]);
    }
    return new QueryUnit(filtered);
  }
};

window.q = {
  Query: QueryUnit
}

var P = window.P = function() {
  this.x = 10;
  this.y = 15;
}

var testData = [
  {
    x: 12,
    y: 10
  }, {
    x: 5
  }, {
    x: 100,
    y: 1
  },
  new P()
];

window.x = new QueryUnit(testData);

})()