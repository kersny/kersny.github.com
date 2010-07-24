var nodes = [];
var circles = [];
var r;
var g;
var b;
var init = function() {
  r = document.getElementById('r');
  g = document.getElementById('g');
  b = document.getElementById('b');
}
//var paper;
Raphael.fn.line = function (ptone, pttwo) {
    if (!(ptone instanceof Point) || !(pttwo instanceof Point))
      throw "Input to Line must be Two Points"
    //var str1 = "M" + ((ptone.x * 30) + 13.5) + " " + ((ptone.y * 30) + 13.5) + "L" + ((pttwo.x * 30) + 13.5) + " "  + ((pttwo.y * 30) + 13.5)
    //Below is faster than above, at least in a Node.js Benchmark (214 ms over 1 million iterations)
    var arr = [];
    arr.push("M");
    arr.push(((ptone.x * 30) + 13.5));
    arr.push(" ");
    arr.push(((ptone.y * 30) + 13.5));
    arr.push("L");
    arr.push(((pttwo.x * 30) + 13.5));
    arr.push(" ");
    arr.push(((pttwo.y * 30) + 13.5));
    var str = arr.join('');
    return this.path(str);
};

Raphael.el.asPoint = function() {
  var color = Raphael.getRGB(this.attr("fill"));
  return new Point(this.x, this.y, parseInt(color.r), parseInt(color.g), parseInt(color.b));
}

window.onload = function() {
  init();
  var paper = Raphael("cvs", 601, 601);
  for (var x = 0; x < 20; x++) {
    for (var y = 0; y < 20; y++) {
      var node = paper.rect((x * 30) + 2, (y * 30) + 2, 27, 27);
      node.x = x;
      node.y = y;
      node.attr({fill: "#000", stroke: "#000"});
      node.click(function (ev) {
        var red = r.value;
        var green = g.value;
        var blue = b.value;
        this.attr("fill", rgb(red, green, blue));
      });
      nodes.push(node);
    }
  }

  document.getElementById('rnd').onclick = function() {
    for (var i in nodes) {
      var node = nodes[i];
      if (Math.random() > 0.8) {
        node.attr("fill", randomColor());
      }
    }
  };
  document.getElementById('clr').onclick = function() {
    clear();
  };

  var clear = function() {
    for (var nodei in nodes) {
      nodes[nodei].attr("fill", "#000");
    }
    var l = circles.length;
    for (var i = 0; i < l; i++) {
      circles.pop().remove();
    }
  };
  document.getElementById('go').onclick = function() {
    var l = circles.length;
    for (var i = 0; i < l; i++) {
      circles.pop().remove();
    }
    
    var clusters = parseInt(document.getElementById('num').value, 10);
    var sample = [];
    for (var i in nodes) {
      var node = nodes[i];
      if (node.attr("fill") != "#000")
        sample.push(node);
    }
    if (sample.length < 1)
      return;
    var randoms = [];
    var outpts = [];
    for (var i = 0; i < clusters; i++) {
      var pt = randomPoint();
      randoms.push(pt);
      
      var outpt = {};
      outpt.x = Number.MIN_VALUE;
      outpt.y = Number.MIN_VALUE;
      outpts.push(outpt);
    }
    //console.log("Initial: ");
    //console.log(randoms);
    //console.log("Samples: ");
    //console.log(sample);
    //console.log("Initial Out Points: ");
    //console.log(outpts);
    var it;

    while(!close(randoms, outpts)) {
      //console.log("Iteration: ");
      //console.log(randoms);
      outpts = randoms;
      it = runIteration(sample, outpts);
      randoms = it.newpts;
      //console.log(randoms);
    }
    //console.log("Final: ");
    //console.log(outpts);

    for (var prop in it.relations) {
      if (it.relations.hasOwnProperty(prop)) {
        var center = it.newpts[prop];
        var points = it.relations[prop];
        //console.log(it);
        //console.log(center);
        //console.log(points);
        for (var point in points) {
          circles.push(paper.line(center, points[point].asPoint()));
        }
      }
    }
    var colors = ["#f00", "#0f0", "00f"];
    for (var i in outpts) {
      var pt = outpts[i];
      var x = pt.x * 30 + 2 + 13.5;
      var y = pt.y * 30 + 2 + 13.5;
      var color = colors[Math.floor(Math.random()*colors.length)];
      circles.push(paper.circle(x, y, 30).attr({"fill": color, "opacity": 0.75, "fill-opacity": 0.75}));
    }
  };
  document.getElementById('goblack').onclick = function() {
    setcolor(0,0,0);
  }
  document.getElementById('gowhite').onclick = function() {
    setcolor(255,255,255);
  }
  document.getElementById('gored').onclick = function() {
    setcolor(255,0,0);
  }
  document.getElementById('gogreen').onclick = function() {
    setcolor(0,255,0);
  }
  document.getElementById('goblue').onclick = function() {
    setcolor(0,0,255);
  }
};

var distance = function(ptone, pttwo) {
  return Math.sqrt(Math.pow(pttwo.x-ptone.x, 2) + Math.pow(pttwo.y-ptone.y, 2) + Math.pow(pttwo.r-ptone.r, 2) + Math.pow(pttwo.g-ptone.g, 2) + Math.pow(pttwo.b-ptone.b, 2));
};

var average = function(arr) {
  var ret = new Point(0,0,0,0,0);
  var len = arr.length;
  for (var i in arr) {
    var tst = arr[i].asPoint();
    ret.x += tst.x;
    ret.y += tst.y;
    ret.r += tst.r;
    ret.g += tst.g;
    ret.b += tst.b;
  };
  return new Point(ret.x/len, ret.y/len, ret.r/len, ret.g/len, ret.b/len);
};

var runIteration = function(points, inpoints) {
  console.log('it')
  var relations = {};
  for (var i in points) {
    var pt = points[i];
    var index = -1;
    var dist = Number.MAX_VALUE;
    for (var j in inpoints) {
      var inpoint = inpoints[j];
      var d = distance(inpoint, pt.asPoint());
      if (d < dist) {
        index = j;
        dist = d;
      }
    }
    if (relations[index]) {
      relations[index].push(pt);
    }
    else {
      relations[index] = [pt];
    }
  }
  var count = 0;
  for (var k in relations) {if (relations.hasOwnProperty(k)) {count++;}};
  var unusedct = inpoints.length - count;
  for (var i = 0; i < unusedct; i++)
	{
	  var rand = count + i + 1;
    relations[rand] = [];
	}
	var newpoints = [];
	for (var k in relations) {
	  if (relations.hasOwnProperty(k)) {
	    if (relations[k].length > 0) {
	      newpoints.push(average(relations[k]));
	    }
	    else {
	      newpoints.push(randomPoint());
      }
		}
  }
  return { newpts: newpoints, relations: relations, pts: points };
};
var close = function(init, fin) {
  if (init.length != fin.length) {
    throw "Different Lengths";
  }

  for (var i in init) {
    var initialval = init[i];
    var finalval = fin[i];
    if (Math.abs(initialval.x - finalval.x > 0.01)) {
      return false;
    }
    if (Math.abs(initialval.y - finalval.y > 0.01)) {
      return false;
    }
    if (Math.abs(initialval.r - finalval.r > 0.01)) {
      return false;
    }
    if (Math.abs(initialval.g - finalval.g > 0.01)) {
      return false;
    }
    if (Math.abs(initialval.b - finalval.b > 0.01)) {
      return false;
    }
  }
  return true;
};

var randomPoint = function() {
  var x = Math.random() * 19;
  var y = Math.random() * 19;
  var r = Math.random() * 255;
  var g = Math.random() * 255;
  var b = Math.random() * 255;
  return new Point(x, y, r, g, b);
};

var setcolor = function(re, gr, bl) {
  r.value = re;
  g.value = gr;
  b.value = bl;;
}

var randomColor = function() {
  return rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255);
}

var rgb = function(r, g, b) {
  var arr = [];
  arr.push("rgb(");
  arr.push(r);
  arr.push(", ");
  arr.push(g);
  arr.push(", ");
  arr.push(b);
  arr.push(")");
  return arr.join('');
}
