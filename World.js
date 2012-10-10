(function() {

/*

Bag is effectively a mini underscore.js - a collection type that allows for
filtering and mapped get/set operations. Many operations on Bags are
chainable. You can also query Bags by property values, similar to a bracket-
less CSS attribute selector.

*/
var Bag = function(array) {
  if (!(this instanceof Bag)) return new Bag(array);
  this.items = array || [];
};
Bag.prototype.push = function() {
  this.items.push(Array.prototype.slice.call(arguments));
};
Bag.prototype.remove = function(item) {
  var remaining = [];
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i] != item) remaining.push(this.items[i]);
  }
  this.items = remaining;
};
Bag.prototype.getAt = function(n) {
  return this.items[n];
};
Bag.prototype.filter = function(f) {
  var filtered = [];
  for (var i = 0; i < this.items.length; i++) {
    if (f(this.items[i])) filtered.push(this.items[i]);
  }
  return new Bag(filtered);
}
Bag.prototype.map = function(f) {
  var mapped = this.items.map(f);
  return new Bag(mapped);
};
Bag.prototype.mapGet = function(p) {
  return this.items.map(function(item) {
    return item[p];
  });
};
Bag.prototype.mapSet = function(p, value) {
  for (var i = 0; i < this.items.length; i++) {
    this.items[i][p] = value;
  }
};
Bag.prototype.invoke = function(name) {
  var args = Array.prototype.slice.call(arguments, 1);
  var map = [];
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    map[i] = item[name].apply(item, args);
  }
}
Bag.prototype.each = function(f) {
  for (var i = 0; i < this.items.length; i++) {
    f(this.items[i]);
  }
};
Bag.prototype.toArray = function() {
  return this.items;
};
/*

We only query on attributes--it saves selector complexity. The supported
selector operators are:
  =   equals
  >   greater than
  >=  greater than or equal to
  <   less than
  <=  less than or equal to
  !=  not equal to
  ?  truthiness
  ~=  array contains
  ^=  string begins
  $=  string ends
  *=  string contains

Multiple selectors can be passed in using a comma. These act as AND operators,
not OR, which is different from CSS but necessary since we're skipping the
brackets.

*/
Bag.prototype.query = function(selectors) {
  selectors = selectors.split(',');
  var matcher = '^\\s*(\\w+)\\s*([<>!~$*^?=]{0,2})\\s*\\"{0,1}([^\\"]*)\\"{0,1}\\s*$';
  var tests = {
    '=': function(a, b) { return a === b },
    '>': function(a, b) { return a > b },
    '>=': function(a, b) { return a >= b },
    '<': function(a, b) { return a <= b },
    '!=': function(a, b) { return a !== b },
    '?': function(a) { return a },
    '~=': function(a, b) {
      if (typeof a.length == 'undefined') return false;
      if (typeof Array.prototype.indexOf != 'undefined') {
        return a.indexOf(b) != -1;
      } else {
        for (var i = 0; i < a.length; i++) {
          if (a[i] == b) return true;
        }
        return false;
      }
    },
    '^=': function(a, b) {
      if (typeof a != 'string') return false;
      return a.search(b) == 0
    },
    '$=': function(a, b) {
      if (typeof a != 'string') return false;
      return a.search(b) == a.length - b.length
    },
    '*=': function(a, b) {
      if (typeof a != 'string') return false;
      return a.search(b) != -1
    },
    fail: function() { return false }
  }
  for (var i = 0; i < selectors.length; i++) {
    var parts = new RegExp(matcher).exec(selectors[i]);
    if (!parts) throw('Bad selector: ' + selectors[i]);
    selectors[i] = {
      key: parts[1],
      operator: parts[2]
    };
    var value = parts[3].replace(/^\s*|\s*$/g, '');
    if (value == "true" || value == "false") {
      value = value == "true";
    } else if (value != "" && !isNaN(value)) {
      value = parseFloat(value);
    }
    selectors[i].value = value;
  };
  var passed = [];
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    var hit = true;
    for (var j = 0; j < selectors.length; j++) {
      var s = selectors[j];
      if (typeof item[s.key] == 'undefined') {
        hit = false;
        break;
      } else if (s.operator) {
        var f = tests[s.operator] || tests.fail;
        if (!f(item[s.key], value)) {
          hit = false;
          break;
        }
      }
    }
    if (hit) {
      passed.push(item);
    }
  }
  return new Bag(passed);
};

/*

The base type for all other objects in the World is the Thing. You extend off
from Thing by calling Thing.mutate() and passing in a type ID string and a
constructor function unique to your type (both of these are optional). Then
you can add properties to your new prototype at your discretion. Yes,
everything ends up shallowly inheriting from Thing, but it's probably not a
good idea to be building deep inheritance chains in your interactive fiction
anyway. There's always mixins, if you need them.

Things come with some basic shared utility methods:

  - get() - returns a property or function value by key. Similar to _.result()

  - proxy() - lets you intercept calls to get() and interfere with them. Useful
    for creating "private" properties, as well as for temporarily overriding
    certain rules.

  - cue() - sets up an action event response. See also:

  - ask() - This is similar to get(), but ask() is meant to be used for user-
    facing events, while get() is meant to construct your own internal APIs.
    ask() should return a string, while get() can return anything.

  - nudge() - feed this an object string from the parser, and it will respond
    true/false depending on whether the object "answers" to that name.

  - say() - output to the browser or UI console via the World. Basically used
    as a local output method.

*/
var Thing = function(world) {
  this.classes = [];
  this.proxy = {};
  this.cues = {
    'look': function() {
      return this.description;
    }
  };

  if (world) {
    this.world = world;
    world.things.push(this);
  }
};
Thing.prototype = {
  name: "",
  description: "",
  get: function(key) {
    if (!this[key]) return null;
    if (this.proxy[key]) {
      return this.proxy[key].call(this);
    }
    if (typeof this[key] == 'function') {
      return this[key]();
    } else {
      return this[key];
    }
  },
  proxy: function(key, f) {
    this.proxy[key] = f;
  },
  ask: function(key) {
    if (!this.cues[key]) return "";
    if (typeof this.cues[key] == 'function') {
      var response = this.cues[key].call(this);
      return response;
    } else {
      var response = this.cues[key];
      if (this.world) this.world.print(response);
      return response;
    }
  },
  cue: function(key, value) {
    this.cues[key] = value;
  },
  say: function(response) {
    if (this.world) {
      this.world.print(response);
    } else {
      console.log(response);
    }
  },
  nudge: function(input) {
    return /override this/.test(input);
  }
}

Thing.mutate = function(tag, f) {
  if (typeof tag == 'function') {
    f = tag;
    tag = 'Thing';
  }
  f = f || function() {};
  var Type = function(world) {
    if (!(this instanceof Type)) {
      if (this instanceof World) return new Type(this);
      return new C();
    }
    Thing.call(this);
    f.call(this);
    if (world) {
      this.world = world;
      world.things.push(this);
    }
  };
  Type.prototype = new Thing();
  Type.prototype.type = tag;
  return Type;
};

var Region = Thing.mutate('Region', function() {
  this.rooms = new Bag();
});

var Room = Thing.mutate('Room', function() {
  this.contents = new Bag();
  this.cue('contents', function() {
    var indent = '\n  ';
    return indent + this.get('contents').query('[background=false]').getAll('long').join(indent);
  });
  this.cue('look', function() {
    this.say('description');
    this.say(this.ask('contents'));
  });
});
Room.prototype.add = function(item) {
  this.contents.push(item);
  item.parent = this;
};
Room.prototype.remove = function(item) {
  this.contents.remove(item);
  item.parent = null;
}

var Container = Thing.mutate('Container', function() {
  this.contents = new Bag();
  this.open = false;
});
Container.prototype.add = function(item) {
  this.contents.push(item);
  item.parent = this;
};
Container.prototype.remove = function(item) {
  this.contents.remove(item);
  item.parent = null;
}


var Person = Thing.mutate('Person');

var Player = Thing.mutate('Player');

var Supporter = Thing.mutate('Supporter', function() {
  this.under = [];
});

var Scenery = Thing.mutate('Scenery', function() {
  this.background = true;
  this.movable = false;
});

var World = function() {
  this.things = [];
  this.player = null;
};
World.prototype = {
  Bag: Bag,
  Thing: Thing.mutate('Thing'),
  Region: Region,
  Room: Room,
  Player: Player,
  Container: Container,
  Supporter: Supporter,
  Scenery: Scenery,
  parse: function() {},
  print: function(line) {
    console.log(line);
  }
};

if (typeof define !== 'undefined') {
  define(function() {
    return World;
  });
} else {
  window.World = World;
}

})();