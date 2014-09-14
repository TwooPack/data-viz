//= require raphael.js
//= require jquery

$(document).ready(function(){


  var model = $('#data_viz_model').data('model');

  Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox(),
        bb2 = obj2.getBBox(),
        p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
        {x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
        {x: bb1.x - 1, y: bb1.y + bb1.height / 2},
        {x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
        {x: bb2.x + bb2.width / 2, y: bb2.y - 1},
        {x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
        {x: bb2.x - 1, y: bb2.y + bb2.height / 2},
        {x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}],
        d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
                dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x,
        y1 = p[res[0]].y,
        x4 = p[res[1]].x,
        y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    if (line && line.line) {
        line.bg && line.bg.attr({path: path});
        line.line.attr({path: path});
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
            line: this.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
    }
};


window.onload = function () {

  var is_drag = false;

  function get_text_element(class_name) {
    for (i = 0; i < texts.length; i++) {
      data = texts[i].data('name');
      if (data == class_name) {
        return texts[i];
      }
    }
  }

  function is_current_attribute_link_object(element) {
    if (group_attributes.length > 0) {
      text_name = group_attributes[0].data('name');
      element_name = element.data('name');
      if (element_name && text_name && element_name == text_name) {
        return true;
      }
    }
    return false;
  }

  function to_camelize(str) {
    return str.replace(/_\w/g,function(match){return match[1].toUpperCase()})
  }

  function calcul_rect_width(element) {
    element_name = element.data('name');
    width = 0;

    if (is_current_attribute_link_object(element)) {
      for (i = 0; i < group_attributes.length; i++) {
        name = group_attributes[i].attr('text');
        if (width < initialize_rect_width(name)) {
          width = initialize_rect_width(name);
        }
      }
    }

    if (width < initialize_rect_width(element_name)) {
      width = initialize_rect_width(element_name);
    }
    return width;
  }

  function initialize_rect_width(class_name) {
    return (class_name.length * 10);
  }

  function resize_all_element() {
    // group.attr('width', 60);
    // group.attr('height', 40);
    for (i = 0; i < shapes.length; i++) {
        shapes[i].attr('height', 40);        
        shapes[i].attr('width', calcul_rect_width(shapes[i]));
        // if (shapes[i].glow) {
        //   shapes[i].glow.remove();
        // }
    }
  }

  var color, i, ii, tempS, tempT, 
    dragger = function () {
        // Original coords for main element
        this.ox = this.type == "ellipse" ? this.attr("cx") : this.attr("x");
        this.oy = this.type == "ellipse" ? this.attr("cy") : this.attr("y");
        if (this.type != "text") this.animate({"fill-opacity": .2}, 500);
            
        // Original coords for pair element
        this.pair.ox = this.pair.type == "ellipse" ? this.pair.attr("cx") : this.pair.attr("x");
        this.pair.oy = this.pair.type == "ellipse" ? this.pair.attr("cy") : this.pair.attr("y");
        if (this.pair.type != "text") this.pair.animate({"fill-opacity": .2}, 500);

        if (is_current_attribute_link_object(this)) {          
          for (i = 0; i < group_attributes.length; i++) {
            group_attributes[i].ox = group_attributes[i].attr('x');
            group_attributes[i].oy = group_attributes[i].attr('y');
          }          
        }
    },
    move = function (dx, dy) {
        is_drag = true;

        // Move main element
        var att = this.type == "ellipse" ? {cx: this.ox + dx, cy: this.oy + dy} : 
                                           {x: this.ox + dx, y: this.oy + dy};
        this.attr(att);
        
        // Move paired element
        att = this.pair.type == "ellipse" ? {cx: this.pair.ox + dx, cy: this.pair.oy + dy} : 
                                           {x: this.pair.ox + dx, y: this.pair.oy + dy};
        this.pair.attr(att);

        // Move the attributes element
        if (is_current_attribute_link_object(this)) {
          for (i = 0; i < group_attributes.length; i++) {
            att = {x: group_attributes[i].ox + dx, y: group_attributes[i].oy + dy};
            group_attributes[i].attr(att);
          }            
        }
        
        // Move connections
        for (i = connections.length; i--;) {
            r.connection(connections[i]);
        }
        r.safari();
    },
    up = function () {

      element = (this.type == 'text') ? this.pair : this;

      if (is_drag != true) {
        
        change_rect = (element.attr('height') == 40) ? true : false;

        // Set all the item to normal size
        // group.attr('width', 60);
        // group.attr('height', 40);

        // Remove and clear group about attribute elements
        group_attributes.remove();
        group_attributes.clear();

        resize_all_element();

        for (i = 0; i < texts.length; i++) {
          
          center = shapes[i].attr('width') / 2;
          texts[i].attr('x', shapes[i].getBBox().x + center);
          // shapes[i].animate({"fill-opacity": 0}, 500);
        }

        if (change_rect == true) {

          // Get class name 
          rect_data = element.data('name');
          text_element = get_text_element(rect_data);

          for (var key in model) {

            if (key == rect_data) {
              y = 40;
              max_length = 0;
              attribute_names = [];

              for (attributes in model[key].attributes) {
                attribute_display = attributes + " : " + model[key].attributes[attributes]
                // attribute_names.push(attribute_display);

                var text = r.text(element.getBBox().x, element.getBBox().y + y, attribute_display).attr({fill: element.attr('fill')});
                text.data('name', rect_data);
                group_attributes.push(text);
                y += 10;
              }

              max_length = calcul_rect_width(element);
              text_element.attr('x', element.getBBox().x + (max_length / 2));

              for (i = 0; i < group_attributes.length; i++) {
                group_attributes[i].attr('x', element.getBBox().x + (max_length / 2))
              }

            }
          }

          // alert(text.getBBox().x);
          // if (element.type != "text") element.animate({"fill-opacity": .2}, 500);
          // if (element.pair.type != "text") element.pair.animate({"fill-opacity": 0}, 500);
          // element.animate({"fill-opacity": .2}, 500);

          /* Change size of the element */
          // element.attr('width', max_length);
          element.attr('width', calcul_rect_width(element));
          element.attr('height', y);
          // glow = element.glow({color: element.attr('fill'), opacity: 0.3});
          // glow.
          // group_glows.push(glow);
        }

        for (i = connections.length; i--;) {
          r.connection(connections[i]);
        }
        
        r.safari();
      }

      // Fade original element on mouse up
      // if (element.type != "text" && element.attr('height') == 40) element.animate({"fill-opacity": 0}, 500);
      
      // Fade paired element on mouse up
      // if (element.pair.type != "text") element.pair.animate({"fill-opacity": 0}, 500);

      is_drag = false;
    },

    r = Raphael("data_viz_model", 640, 480),
    group = r.set();
    group_attributes = r.set();
    group_glows = r.set();
    texts_attributes = [],
    connections = [],
    shapes = [],
    texts = [],
    data = []

    for (var key in model) {
      // use hasOwnProperty to filter out keys from the Object.prototype
      if (model.hasOwnProperty(key) && key != "date") {
        x = Math.floor((Math.random() * 500) + 50);
        y = Math.floor((Math.random() * 300) + 50);

        // shapes.push(r.ellipse(x, y, 30, 20));


        rect_width = initialize_rect_width(key);

        var rect = r.rect(x, y, rect_width, 40, 10);
        var text = r.text(x + rect_width / 2, y + 20, key);

        /* set data with class name */
        rect.data('name', key);
        text.data('name', key);

        shapes.push(rect);
        texts.push(text);
        data.push(key);

        group.push(rect);
        group.push(text);
        text.drag(move, dragger, up);
      }
    }

    i = 0;
    for (var key in model) {
      if (key != "date") {
        for (var relation in model[key].relations) {
          relation_level = model[key].relations[relation];
          if (relation_level && relation_level == "has_many") {
            class_name = relation[0].toUpperCase() + relation.slice(1, relation.length - 1);
            class_name = to_camelize(class_name);
            index = data.indexOf(class_name);
            if (index >= 0) {
              connections.push(r.connection(shapes[i], shapes[index], "#616161", "#616161"));
            }
          }
          else if (relation_level && relation_level == "has_one") {
            class_name = relation[0].toUpperCase() + relation.slice(1);
            class_name = to_camelize(class_name);

            index = data.indexOf(class_name);
            if (index >= 0) {
                connections.push(r.connection(shapes[i], shapes[index], "#616161"));
              }
          }
        }
        i++;
      }
    }

    for (i = 0, ii = shapes.length; i < ii; i++) {
      color = Raphael.getColor();
      tempS = shapes[i].attr({fill: color, stroke: color, "fill-opacity": 0.2, "stroke-width": 2, cursor: "move"});
      tempT = texts[i].attr({fill: color, stroke: "none", "font-size": 15, cursor: "move"});
      shapes[i].drag(move, dragger, up);
      // texts[i].drag(move, dragger, up);
      
      // Associate the elements
      tempS.pair = tempT;
      tempT.pair = tempS;
    }
    
  };

});