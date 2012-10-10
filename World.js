(function() {

/*

Bag is effectively a mini underscore.js - a collection type that allows for
filtering and mapped get/set operations. Many operations on Bags are
chainable. You can also query Bags by property values, similar to a bracket-
less CSS attribute selector.

When constructing a Bag, you can pass any number of arrays or other Bags, and
it will combine them all into one flat collection.

*/
var Bag = function() {
  if (!(this instanceof Bag)) return new Bag(array);
  var args = Array.prototype.slice(arguments);
  this.items = [];
  for (var i = 0; i < args.length; i++) {
    var package = args[i];
    if (typeof package.toArray != 'undefined') {
      package = package.toArray();
    }
    this.items = this.items.concat(package);
  }
  this.length = this.items.length;
};
Bag.prototype.push = function() {
  this.items.push.apply(this.items, Array.prototype.slice.call(arguments));
  this.length = this.items.length;
  return this;
};
Bag.prototype.remove = function(item) {
  var remaining = [];
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i] != item) remaining.push(this.items[i]);
  }
  this.items = remaining;
  this.length = this.items.length;
  return this;
};
Bag.prototype.at = function(n) {
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
  return this;
};
Bag.prototype.invoke = function(name) {
  var args = Array.prototype.slice.call(arguments, 1);
  var map = [];
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    if (typeof item[name] != 'function') continue;
    var result = item[name].apply(item, args);
    if (typeof result != 'undefined') {
      map.push(result);
    }
  }
  return map;
}
Bag.prototype.each = function(f) {
  for (var i = 0; i < this.items.length; i++) {
    f(this.items[i]);
  }
  return this;
};
Bag.prototype.toArray = function() {
  return this.items;
};
Bag.prototype.combine = function() {
  var args = Array.prototype.slice.call(arguments);
  for (var i = 0; i < args.length; i++) {
    var adding = args[i];
    if (adding instanceof Bag) {
      this.items = this.items.concat(adding.items);
    } else {
      this.items = this.items.concat(adding);
    }
    this.length = this.items.length;
    return this;
  }
}
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
    with itself if the object "answers" to that name. For simplicity's sake, you
    can just set this.pattern and use the default nudge function.

  - say() - output to the browser or UI console via the World. Basically used
    as a local output method.

*/
var Thing = function(world) {
  this.classes = [];
  this.proxies = {};
  this.cues = {
    'look': function() {
      this.say(this.description);
    }
  };
  this.pattern = /abcdefg/i;

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
    if (this.proxies[key]) {
      return this.proxies[key].call(this);
    }
    if (typeof this[key] == 'function') {
      return this[key]();
    } else {
      return this[key];
    }
  },
  proxy: function(key, f) {
    this.proxies[key] = f;
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
    var result = this.pattern.test(input);
    if (result) return this;
  }
}

/*

Why mutate() all the Things? A couple of reasons:

  * We want to inherit from Thing using good JavaScript prototypes, but calling
  Thing.call(this) for our super-constructor is annoying--as is the need to
  constantly check whether the constructor is being called via "new" or via
  the factory. Using mutate(), we make sure that a fresh type is constructed,
  but the constructor boilerplate is still abstracted away.

  JavaScript constructor patterns are terrible. This library aims to be, as
  much as possible, a tool for people who are not JavaScript gurus. As a
  result, we want to isolate users from the brittleness of constructor
  function/prototype/prototype.constructor as much as possible. Using mutate()
  (and, more often, using the factory functions via the World object) keeps
  the inheritable madness to a minimum.

*/

Thing.mutate = function(tag, f) {
  if (typeof tag == 'function') {
    f = tag;
    tag = 'Thing';
  }
  f = f || function() {};
  var Type = function(world) {
    if (!(this instanceof Type)) {
      if (this instanceof World) return new Type(this);
      return new Type();
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
  this.proxy('contents', function() {
    console.log(this);
    if (this.open) {
      return this.contents;
    }
    return [];
  })
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

/*

The Console exists (not to be confused with the browser console) to direct
input into the parser and handle output from it. You don't need to directly
instantiate a console unless you really want to--the World will create one as
its "io" property, and then you can wire it up to an input field and an
element for output.

*/
var Console = function(input, output) {
  if (input && output) this.attach(input, output);
  this.onKey = this.onKey.bind(this);
  this.memory = [];
  this.memoryPointer = 0;
};
Console.prototype = {
  tagName: "div",
  className: "console-line",
  memory: null,
  memoryPointer: 0,
  attach: function(input, output) {
    if (this.input) {
      this.input.removeEventListener('keyup', this.onKey);
    };
    this.input = input;
    this.input.addEventListener('keyup', this.onKey);

    this.output = output;
  },
  onKey: function(e) {
    switch (e.keyCode) {

      case 13:
        var input = this.input.value;
        this.memory.unshift(input);
        this.memoryPointer = 0;
        this.read(input);
        this.input.value = "";
      break;

      case 38: //up
        this.input.value = this.memory[this.memoryPointer] || this.input.value;
        this.memoryPointer++;
      break;
    }
  },
  read: function(line) {
    if (this.onRead) this.onRead(line);
  },
  write: function(text) {
    var tag = document.createElement(this.tagName);
    tag.className = this.className;
    tag.innerHTML = text;
    this.output.appendChild(tag);
  }
}

/*

You'll rarely interact with the Parser directly, although it's there if you
need to. Instead, the World instantiates a parser for itself, and you'll use
its utility methods to add command mappings indirectly.

*/
var Parser = function(world, console) {
  this.world = world;
  if (console) this.attach(console);
  this.rules = [];
};
Parser.prototype = {
  errorMessage: "I don't understand that.",
  attach: function(console) {
    this.console = console;
    console.onRead = this.input.bind(this);
  },
  input: function(line) {
    var sentence = this.evaluate(line);
    if (sentence == false) {
      this.console.write(this.errorMessage);
    }
  },
  /*

    Rule definitions consist of two parts: a regular expression pattern used
    to parse out the command, and a translation function that does something
    based on the parts that are passed back. So you might have a look command:

    /(look|examine|describe)\s(at\s)*([\w\s])/i

    and then a translator function that turns it into an action:

    function(parts) {
      var verb = 'look';
      var object = parts[3];
      //gather items that respond to that name
      var prospects = world.localThings().invoke('nudge', object);
      if (prospects.length > 1) {
        return "I'm not sure which '" + object + "' you mean.";
      } else if (prospects.length) {
        return prospects.getAt(0).ask(verb);
      }
      return false;
    }

  */
  addRule: function(pattern, translator) {
    if (typeof pattern == 'string') {
      pattern = new RegExp(pattern);
    }
    this.rules.push({
      pattern: pattern,
      translate: translator
    });
  },
  /*

  Rules are evaluated in first-in, first-out order. If no matching rule is
  found, it returns false.

  */
  evaluate: function(input) {
    for (var i = 0; i < this.rules.length; i++) {
      var rule = this.rules[i];
      var matches = rule.pattern.exec(input);
      if (matches) {
        return rule.translate(matches);
      }
    }
    return false;
  }
}

/*

And here we are, finally, at the World. You instantiate one (or more) of these
for your game, and then it provides factory access to the different object
types, as well as some input and output utility functions.

*/
var World = function() {
  this.things = [];
  this.asLocal = [];
  this.player = new Player();
  this.io = new Console();
  this.parser = new Parser(this, this.io);
  this.currentRoom = null;
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
  print: function(line) {
    this.io.write(line);
  },
  considerLocal: function(bag) {
    this.asLocal.push(bag);
  },
  getLocalThings: function() {
    var things = new Bag(this.asLocal);
    if (this.currentRoom) {
      things.combine(this.currentRoom.contents);
    }
    var len = things.length;
    for (var i = 0; i < len; i++) {
      var item = things.at(i);
      if (item instanceof Container || item instanceof Supporter) {
        things.combine(item.get('contents'));
      }
    }
    return things;
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