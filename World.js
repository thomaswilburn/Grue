(function() {

var requireExists = typeof window.define == 'function' && typeof window.require == 'function';

/*

Bag is a kind of limited-use underscore.js - an explicitly-unsorted collection
type, aimed directly at objects, that allows for filtering and mapped get/set
operations. Many operations on Bags are chainable. You can also query Bags by
property values, similar to a bracket-less CSS attribute selector. A Bag is
an apt metaphor for this: you basically put objects into it and then grope
around blindly for what you need later on.

*/
var Bag = function(array) {
  if (!(this instanceof Bag)) return new Bag(array);
  this.items = [];
  if (array) {
    if (typeof array.toArray != 'undefined') {
      array = array.toArray();
    }
    this.items = this.items.concat(array);
  }
  this.length = this.items.length;
};
Bag.prototype.push = function() {
  this.items.push.apply(this.items, Array.prototype.slice.call(arguments));
  this.length = this.items.length;
  return this;
};
Bag.prototype.add = Bag.prototype.push;
Bag.prototype.remove = function(item) {
  var remaining = [];
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i] != item) remaining.push(this.items[i]);
  }
  this.items = remaining;
  this.length = this.items.length;
  return this;
};
Bag.prototype.first = function() {
  return this.items[0];
};
Bag.prototype.at = function(n) {
  return this.items[n];
};
Bag.prototype.contains = function(o) {
  return this.items.indexOf(o) != -1;
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
Bag.prototype.reduce = function(f, initial) {
  return this.items.reduce(f, initial);
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
  return new Bag(map);
}
Bag.prototype.each = function(f) {
  for (var i = 0; i < this.items.length; i++) {
    f(this.items[i]);
  }
  return this;
};
Bag.prototype.some = function(f) {
  for (var i = 0; i < this.items.length; i++) {
    var result = f(this.items[i]);
    if (result === false) break;
  }
  return this;
}
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
        if (!f(item[s.key], s.value)) {
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
    can just set this.pattern and use the default nudge function. You'll often
    invoke nudge() on a Bag of objects to figure out if they respond to a given
    parser input.

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
  this.pattern = /abcdefgh/i;

  if (world) {
    this.world = world;
    world.things.push(this);
  }
};
Thing.prototype = {
  name: "",
  description: "",
  /*

  background and portable are the first of a series of default properties we
  should decide to have (or not to have). I would love to have these loaded
  from somewhere else, but I haven't figured that out yet. Worst case
  scenario, you load these onto Thing.prototype before instantiating your
  world.

  */
  background: false,
  portable: false,

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
  ask: function(key, event) {
    if (!this.cues[key]) return "";
    if (typeof this.cues[key] == 'function') {
      var response = this.cues[key].call(this, event);
      return response;
    } else {
      var response = this.cues[key];
      this.say(response);
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

  First, we want to inherit from Thing using good JavaScript prototypes, but
  calling Thing.call(this) for our super-constructor is annoying--as is the
  need to constantly check whether the constructor is being called via "new"
  or via the factory. Using mutate(), we make sure that a fresh type is
  constructed, but the constructor boilerplate is still abstracted away. This
  boilerplate includes one bit of world-building magic: Thing constructors
  called from a World object will automatically add themselves to it for
  access via the world's convenience collection methods.

  Second, JavaScript constructor patterns are terrible. This library aims to
  be, as much as possible, a tool for people who are not JavaScript gurus. As
  a result, we want to isolate users from the brittleness of constructor
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
    Thing.call(this, world);
    f.call(this);
  };
  Type.prototype = new Thing();
  Type.prototype.type = tag;
  return Type;
};

var Room = Thing.mutate('Room', function() {
  this.regions = new Bag();
  this.contents = new Bag();
  this.cue('contents', function() {
    var contents = this.get('contents').query('type!=Scenery');
    if (contents.length) {
      return this.world.format.as('list', {label: 'In this area:', data: contents.mapGet('name')} );
    }
    return "";
  });
  this.cue('look', function() {
    this.say(this.world.format.text(this.description, this.ask('contents')));
  });
  this.cue('go', function(event) {
    var compass = {
      west: 'w',
      north: 'n',
      south: 's',
      east: 'e',
      up: 'u',
      down: 'd',
      inside: 'in',
      outside: 'out'
    }
    var direction = event.direction;
    if (compass[direction]) direction = compass[direction];
    var portal = this.get(direction);
    if (!portal) {
      this.say("You can't go that way.");
    } else {
      this.world.currentRoom = portal;
      if (portal.check('look')) portal.ask('look');
    };
  });
});
Room.prototype.add = function(item) {
  this.contents.push(item);
  item.parent = this;
};
Room.prototype.remove = function(item) {
  this.contents.remove(item);
  item.parent = null;
};
Room.prototype.query = function(selector) {
  return this.contents.query(selector);
};
/*

  Rooms have a "regions" Bag that you can use to share rules across a zone.
  Regions are not actually containers--they're just Things that respond to
  ask() with false if the command is being intercepted. Any rules that can be
  preempted by a region, such as "look," should call World.currentRoom.check()
  the same way that they would call ask() on a target object first.

*/
Room.prototype.check = function(key, event) {
  var cancelled = this.regions.reduce(function(memo, region) {
    return region.ask(key, event) !== false && memo;
  }, true);
  return cancelled;
}

var Container = Thing.mutate('Container', function() {
  this.contents = new Bag();
  this.open = false;
  this.preposition = "Inside: "
  this.proxy('contents', function() {
    if (this.open) {
      return this.contents;
    }
    return new Bag();
  });
  this.cue('open', function() {
    this.open = true;
    this.say('Opened.');
  });
  this.cue('close', function() {
    this.open = false;
    this.say('Closed.');
  });
  this.cue('contents', function() {
    var contents = this.get('contents');
    if (!contents.length) return "";
    var response = this.world.format.as('list', {label: this.preposition, data: contents.mapGet('name')});
    return response;
  });
  this.cue('look', function() {
    this.say(this.world.format.text(this.description, this.ask('contents')));
  });
});
Container.prototype.add = function(item) {
  this.contents.push(item);
  item.parent = this;
};
Container.prototype.remove = function(item) {
  this.contents.remove(item);
  item.parent = null;
};

var Person = Thing.mutate('Person');

var Player = Thing.mutate('Player', function() {
  this.inventory = new Container(this.world);
  this.inventory.preposition = "In your inventory:";
  this.inventory.open = true;
});

var Supporter = Thing.mutate('Supporter', function() {
  this.contents = new Bag();
});
Supporter.prototype.add = function(item) {
  this.contents.push(item);
  item.parent = this;
};
Supporter.prototype.remove = function(item) {
  this.contents.remove(item);
  item.parent = null;
};

var Scenery = Thing.mutate('Scenery', function() {
  this.background = true;
});

/*

The Console (not to be confused with the browser console) exists to direct
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
  echoClass: "console-echo",
  echoQuote: "> ",
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
    this.write(line, true);
    if (this.onRead) this.onRead(line);
  },
  write: function(text, echo) {
    var tag = document.createElement(this.tagName);
    tag.className = echo ? [this.className, this.echoClass].join(' ') : this.className;
    tag.innerHTML = echo ? this.echoQuote + text : text;
    this.output.appendChild(tag);
    if (this.onUpdate) {
      this.onUpdate();
    }
  },
  onUpdate: null
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
  to parse out the command, and a responder function that does something
  based on the parts that are passed back. So you might have a look command:

  /(look|examine|describe)\s(at\s)*([\w\s])/i

  and then a responder function that turns it into an action:

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

  If you pass a String instead of a regular expression to addRule, it will
  attempt to compile it using a simple parameter conversion. See compileRule()
  below for more details.

  */
  addRule: function(pattern, responder) {
    if (typeof pattern == 'string') {
      this.rules.push(this.compileRule(pattern, responder));
    } else {
      this.rules.push({
        pattern: pattern,
        responder: responder
      });
    }
  },

  /*

  Many commands are simple enough that you shouldn't need to write regular
  expressions for them. The parser will try to compile a space-delimited
  string into a regular expression for you, using a simple, route-like syntax.
  For example, we might write:

  attack :monster with? :weapon?

  Words preceded with a colon are named parameters, and those followed with a
  question mark are optional. Even though JavaScript's regular expression
  engine lacks named parameters, we can fake it by wrapping the responder in a
  function that adds our parameters to the match array.

  */

  compileRule: function(pattern, responder) {
    var words = pattern.split(' ');
    var positions = {};
    for (var i = 0; i < words.length; i++) {
      var original = words[i];
      words[i] = original.replace(/[?:]/g, '');
      if (original.substr(0, 1) == ':') {
        positions[words[i]] = i + 1;
        words[i] = "\\w+";
      }
      words[i] = "(" + words[i] + ")";
      if (original.substr(-1) == "?") {
        words[i] += "*";
      }
    }
    var compiled = new RegExp(words.join('\\s*'));
    var filter = function(matches) {
      for (var key in positions) {
        matches[key] = matches[positions[key]];
      }
      responder.call(this, matches);
    }
    return {
      pattern: compiled,
      responder: filter
    }
  },

  /*

  Rules are evaluated in first-in, first-out order. If no matching rule is
  found, it returns false. Rule response functions are called in the
  context of the world (this == the world).

  */
  evaluate: function(input) {
    for (var i = 0; i < this.rules.length; i++) {
      var rule = this.rules[i];
      var matches = rule.pattern.exec(input);
      if (matches) {
        return rule.responder.call(this.world, matches);
      }
    }
    return false;
  }
};

/*

I realized, partway through getting the inventory and item listings up, that
I'm starting to embed a lot of HTML. Now that I use a lot of templates in my
day job, it's obvious that inline HTML is a serious maintenance code smell.
Enter the Formatter, which is used by various objects to prepare their output
in predefined ways. This version still just basically runs off inline HTML,
but it will be extended to use templates instead.

All Formatter method calls recieve an object with two properties: label and
data (this should be familiar to AS3 coders). You can replace the Formatter
with your own object with no problems, as long as your functions can handle
these two properties.

Although you can call the Formatter methods directly, it probably makes more
sense to go through Formatter.as(), which takes a string key as the first
argument. as() can provide fallbacks in case of missing methods, whereas
calling a missing method is a type error in JavaScript. If you define your own
format object, just copy Format.as over to your version--it'll still work.

*/

var Formatter = {
  as: function(type, message) {
    if (typeof this[type] == 'undefined') {
      type == 'text';
    }
    return this[type](message);
  },
  text: function() {
    var lines = Array.prototype.slice.call(arguments);
    return lines.join('<br>');
  },
  list: function(message) {
    var output = message.label;
    output += "<ul>";
    var data = message.data;
    if (typeof data == 'string' || typeof data == 'number') {
      data = [data];
    }
    for (var i = 0; i < data.length; i++) {
      output += "<li>" + data[i] + "</li>";
    }
    output += "</ul>";
    return output;
  }
}

/*

And here we are, finally, at the World. You instantiate one (or more) of these
for your game, and then it provides factory access to the different object
types, as well as some input and output utility functions.

*/
var World = function() {
  this.things = [];
  this.player = new Player(this);
  this.asLocal = [this.player.inventory];
  this.io = new Console();
  this.parser = new Parser(this, this.io);
  this.currentRoom = null;
  this.format = Formatter;

  //Grue uses AMD to load its base rules without excessive hackery. 
  //Note: it would be nice to be more careful with their existence.
  var self = this;
  if (requireExists) {
    require(['Grue/BaseRules'], function(BaseRules) {
      BaseRules.init(self);
    });
  }
};
World.prototype = {
  Bag: Bag,
  Thing: Thing.mutate('Thing'), // Exposed to create plain "Things"
  mutate: Thing.mutate, //Exposed for mutation
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
  getLocal: function(query, target, multiple) {
    var things = new Bag(this.asLocal);
    if (this.currentRoom) {
      things.combine(this.currentRoom.get('contents'));
    }
    var len = things.length;
    for (var i = 0; i < len; i++) {
      var item = things.at(i);
      if ((item instanceof Container && item.open) || item instanceof Supporter) {
        things.combine(item.get('contents'));
      }
    }
    if (query) {
      things = things.query(query);
    }
    things.nudge = function(keyword) {
      return this.invoke('nudge', keyword);
    };
    if (target) {
      if (multiple) {
        return things.nudge(target);
      }
      return things.nudge(target).first();
    }
    return things;
  },
  query: function(selector) {
    return new Bag(this.things).query(selector);
  },
  askLocal: function(verb, object) {
    var allowed = this.currentRoom.check(verb);
    if (!allowed) {
      return;
    }
    var awake = this.getLocal(false, object);
    if (awake) {
      awake.ask(verb);
    }
  }
};

/*

I recommend using AMD modules to load Grue, but it's not a hard and fast
requirement. It registers itself as Grue, but returns the World constructor.
See test.js for an example of doing this properly.

If you don't include some kind of AMD loader, however, the base rules aren't
going to load, so you'd better like writing parser vocabulary.

*/

if (requireExists) {
  define('Grue', function() {
    return World;
  });
} else {
  window.World = World;
}

})();