var nodes = [];
var circles = [];
//var paper;
Raphael.fn.line = function (ptone, pttwo) {
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


$(function() {
  var paper = Raphael("cvs", 601, 601);
  for (var x = 0; x < 20; x++) {
    for (var y = 0; y < 20; y++) {
      var node = paper.rect((x * 30) + 2, (y * 30) + 2, 27, 27);
      node.x = x;
      node.y = y;
      node.attr({fill: "#333", stroke: "#333"});
      node.click(function (ev) {
        if (this.attr("fill") == "#333")
        {
          this.attr("fill", "#fff");
        }
        else
        {
          this.attr("fill", "#333");
        }
      });
      nodes.push(node);
    }
  }

  $('#rnd').click(function() {
    for (var i in nodes) {
      var node = nodes[i];
      if (Math.random() > 0.8) {
        node.attr("fill", "#fff");
      }
    }
  });
  $('#clr').click(function() {
    clear();
  });

  var clear = function() {
    for (var nodei in nodes) {
      nodes[nodei].attr("fill", "#333");
    }
    var l = circles.length;
    for (var i = 0; i < l; i++) {
      circles.pop().remove();
    }
  };
  $('#go').click(function() {
    var l = circles.length;
    for (var i = 0; i < l; i++) {
      circles.pop().remove();
    }
    
    var clusters = parseInt($('#num').val(), 10);
    var sample = JSLINQ(nodes).Where(function (item) {return item.attr("fill") == "#fff";}).items;
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
        for (var point in points) {
          circles.push(paper.line(center, points[point]));
        }
      }
    }
    var colors = ["#f00", "#0f0", "00f"];
    for (var i in outpts) {
      var pt = outpts[i];
      var x = pt.x * 30 + 2 + 13.5;
      var y = pt.y * 30 + 2 + 13.5;
      var color = colors[Math.floor(Math.random()*colors.length)];
      circles.push(paper.circle(x, y, 30).attr({"fill": color, "opacity": 0.5, "fill-opacity": 0.5}));
    }
  });
});

var distance = function(ptone, pttwo) {
  return Math.sqrt(Math.pow(pttwo.x-ptone.x, 2) + Math.pow(pttwo.y-ptone.y, 2));
};

var average = function(arr) {
  var ret = {x:0, y:0};
  for (var i in arr) {
    ret.x += arr[i].x;
    ret.y += arr[i].y;
  };
  return {x: ret.x/arr.length, y: ret.y/arr.length};
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
      var d = distance(inpoint, pt);
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
	      newpoints.push({});
      }
		}
  }
  return { newpts: newpoints, relations: relations, pts: points };
};
var close = function(init, fin) {
  if (init.length != fin.length) {
    console.log(init);
    console.log(fin);
    throw "Different Lengths";
  }

  for (var i in init) {
    var initialval = init[i];
    var finalval = fin[i];
    if (initialval.x - finalval.x > 0.01 || finalval.x - initialval.x > 0.01) {
      return false;
    }
    if (initialval.y - finalval.y > 0.01 || finalval.y - initialval.y > 0.01) {
      return false;
    }
  }
  return true;
};

var randomPoint = function() {
  var ret = {};
  ret.x = Math.random() * 19;
  ret.y = Math.random() * 19;
  return ret;
};
