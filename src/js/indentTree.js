// indentTree.js
//define context menu functions
window.Widgets.IndentTree = {};

(function ($, ns, d3, document, window) {
  
  ns.indentTree = function(data, contextMenuNs, tree_svg, options = {}) {
    
    // WARNING: x and y are switched because the d3.tree is vertical rather than the default horizontal
    var theme = {};
    if (options.theme === 'light') {
      theme = options.light_theme;
    } else {
      theme = options.dark_theme;
    }
    //menu items
    
    // 3. Setup RMB Menu Items
    let treeMenuItems = [
      {
      title: 'Copy Object',
      action: (d) => {
          // TODO: add any action you want to perform
          console.log('Tree Copy Object', d);
      },
      },
      {
      title: 'Create Relationship',
      action: (d) => {
          // TODO: add any action you want to perform
          console.log('Tree Create Relationship ->', d);
      },
      },
  ];

    // tooltip
    let indentTooltip = d3.select("body")
        .append("div")
          .attr('class', 'indentTooltip')
          .style('display', 'block')
          .style("position", "absolute")
          .style("z-index", "10")
          .style("background-color", theme.tooltip.fill)
          .style("border", "solid")
          .style("border-width",  theme.tooltip.stroke)
          .style("border-color",  theme.tooltip.scolour)
          .style("border-radius",  theme.tooltip.corner)
          .style("padding",  theme.tooltip.padding)
          .style('opacity', 0);

    // Function that assembles the HTML tooltip string
    let htmltooltip = function (d) {
      // console.log('d->',d);tooltip paragraph style
      let pgraph_style = '<p style="font-size:' + toString(theme.tooltip.tsize) + '">';
      pgraph_style += '<font color="' + theme.tooltip.tcolour +'">';
      // initilaise description string with  paragraph style
      let desc_string = pgraph_style;
      if (options.tooltipContent == 'json') {
        return d.data;
      }
      // setup 
      // add heading
      desc_string += '<b>' + d.data.heading + '</b>' + '<br>';
      // add description
      desc_string += d.data.description;

      return desc_string;
    }  

     // Three function that change the tooltip when user hover / move / leave a cell
     let mouseover = function(d) {
      indentTooltip
        .transition()
        .duration(options.duration)
        .style("opacity", 1)
      d3.select(this)
        .style("stroke", theme.select)
        .style("opacity", 1)
    }
    let mousemove = function(event, d) {
      indentTooltip
        .html(htmltooltip(d))
        .style("left", (event.pageX+70) + "px")
        .style("top", (event.pageY) + "px")
    }
    let mouseleave = function(d) {
      indentTooltip
        .style("opacity", 0)
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
    }

    // settings
  
    let plus = {
      shapeFill: theme.checkColour,
      shapeStroke: theme.checkColour,
      textFill: theme.checkText,
      text: '+',
    };
    let minus = {
      shapeFill: theme.checkColour,
      shapeStroke: theme.checkColour,
      textFill: theme.checkText,
      text: '−',
    };
    //
    let tree = d3
      .tree()
      .nodeSize([options.lineSpacing, options.indentSpacing]);
  
    let root = d3.hierarchy(data);
  
    root.x0 = 0;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
      if (d.depth && d.data.name.length !== 7)
        d.children = null;
    });
  
    let index = -1;
    root.eachBefore(function (n) {
      ++index;
    }); // counts original number of items
  
    //resonsive size before icons had height =  Math.max(minHeight, index * lineSpacing + marginTop + marginBottom )
    let svg = tree_svg;
  
    let tree_rect = svg
      .append('rect')
      .attr('class', 'index_rect')
      .attr('width', options.index_width)
      .attr('height', options.svg_height)
      .attr('stroke', theme.svgBorder)
      .attr('fill', theme.treeFill)
      .attr(
        'transform',
        'translate(' +
          -options.margin.left +
          ',' +
          -options.margin.top +
          ')',
      );
  
    const gLink = svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', theme.edges)
      .attr('stroke-width', options.tree_edge_thickness);
  
    const gNode = svg
      .append('g')
      .attr('cursor', 'pointer')
      .attr('pointer-events', 'all');
  
    let indexLast;
    function update(source) {
      const nodes = root.descendants().reverse();
      const links = root.links();
  
      // Compute the new tree layout.
      tree(root);
  
      // node position function
      index = -1;
      root.eachBefore(function (n) {
        n.x = ++index * options.lineSpacing;
        n.y = n.depth * options.indentSpacing;
      });
  
      const height = Math.max(
        options.minHeight,
        index * options.lineSpacing +
          options.margin.top +
          options.margin.bottom,
      );
  
      const transition = svg
        .transition()
        .duration(options.duration)
        .attr('height', options.svg_height)
        .attr('viewBox', [
          -options.margin.left,
          -options.margin.top,
          options.index_width,
          options.svg_height,
        ])
        .tween(
          'resize',
          window.ResizeObserver
            ? null
            : () => () => svg.dispatch('toggle'),
        );
  
      svg
        .transition()
        .delay(indexLast < index ? 0 : options.duration)
        .duration(0)
        .attr('viewBox', [
          -options.margin.left,
          -options.margin.top,
          options.index_width,
          options.svg_height,
        ]);
  
      // Update the nodes…
      const node = gNode
        .selectAll('g')
        .data(nodes, (d) => d.id);
  
      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node
        .enter()
        .append('g')
        .attr(
          'transform',
          (d) => `translate(${d.y},${source.x0})`,
        )
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .on('click', (event, d) => {
          d.children = d.children ? null : d._children;
          update(d);
  
          charge
            .attr('fill', (d) =>
              d._children
                ? d.children
                  ? minus.textFill
                  : plus.textFill
                : 'none',
            )
            .text((d) =>
              d._children
                ? d.children
                  ? minus.text
                  : plus.text
                : '',
            );
  
          box.attr('fill', (d) =>
            d._children
              ? d.children
                ? minus.shapeFill
                : plus.shapeFill
              : 'none',
          );
        });
  
      // check box
      let box = nodeEnter
        .append('rect')
        .attr('width', options.boxSize)
        .attr('height', options.boxSize)
        .attr('x', -options.boxSize / 2)
        .attr('y', -options.boxSize / 2)
        .attr('fill', (d) =>
          d._children
            ? d.children
              ? minus.shapeFill
              : plus.shapeFill
            : 'none',
        )
        .attr('stroke', (d) =>
          d._children ? theme.checkColour : 'none',
        )
        .attr('stroke-width', 0.5);
  
      // check box symbol
      let charge = nodeEnter
        .append('text')
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('fill', (d) =>
          d._children
            ? d.children
              ? minus.textFill
              : plus.textFill
            : 'none',
        )
        .text((d) =>
          d._children ? (d.children ? '−' : '+') : '',
        );
  
      // attach icon
      let image = nodeEnter
        .append('image')
        .attr('x', 8 + options.boxSize / 2)
        .attr(
          'y',
          -options.icon_size / 2, // - options.boxSize / 2,
        )
        .attr('xlink:href', function (d) {
          console.log('d->', d);
          console.log(
            'prefix->',
            options.prefix,
            ', shape->',
            options.shape,
          );
          console.log(
            options.prefix +
              options.shape +
              d.data.icon +
              '.svg',
          );
          return (
            options.prefix +
            options.shape +
            d.data.icon +
            '.svg'
          );
        })
        .attr('width', function (d) {
          return options.icon_size;
        })
        .attr('height', function (d) {
          return options.icon_size;
        })
        .on('mouseover.tooltip', mouseover)
        .on("mousemove", mousemove)
        .on("mouseout.tooltip", mouseleave)
        .on('contextmenu', (d) => {
          contextMenuNs.createContextMenu(d, treeMenuItems, '.index_svg');
        });
  
      // label text
      let label = nodeEnter
        .append('text')
        .attr(
          'x',
          options.icon_size + 14 + options.boxSize / 2,
        )
        .attr('text-anchor', 'start')
        .style('font-size', options.itemFont)
        .attr('dy', '0.32em')
        .text((d) => d.data.name);
  
      // Transition nodes to their new position.
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition(transition)
        .attr('transform', (d) => `translate(${d.y},${d.x})`)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);
  
      // Transition exiting nodes to the parent's new position.
      const nodeExit = node
        .exit()
        .transition(transition)
        .remove()
        .attr(
          'transform',
          (d) => `translate(${d.y},${source.x})`,
        )
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0);
  
      // Update the links…
      const link = gLink
        .selectAll('path')
        .data(links, (d) => d.target.id);
  
      // Enter any new links at the parent's previous position.
      const linkEnter = link
        .enter()
        .append('path')
        .attr('stroke-opacity', 0)
        .attr('d', (d) =>
          ns.makeLink(
            [d.source.y, source.x],
            [
              d.target.y +
                (d.target._children
                  ? 0
                  : options.boxSize / 2),
              source.x,
            ],
            options.radius,
          ),
        );
  
      // Transition links to their new position.
      link
        .merge(linkEnter)
        .transition(transition)
        .attr('stroke-opacity', 1)
        .attr('d', (d) =>
          ns.makeLink(
            [d.source.y, d.source.x],
            [
              d.target.y +
                (d.target._children
                  ? 0
                  : options.boxSize / 2),
              d.target.x,
            ],
            options.radius,
          ),
        );
  
      // Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition(transition)
        .remove()
        .attr('stroke-opacity', 0)
        .attr('d', (d) =>
          ns.makeLink(
            [d.source.y, source.x],
            [
              d.target.y +
                (d.target._children
                  ? 0
                  : options.boxSize / 2),
              source.x,
            ],
            options.radius,
          ),
        );
  
      // Stash the old positions for transition.
      root.eachBefore((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
  
      indexLast = index; // to know if viewbox is expanding or contracting
    }
  
    update(root);
  
    return svg.node();
  }
  
  ns.makeLink = function (start, end, radius) {
    const path = d3.path();
    const dh = (4 / 3) * Math.tan(Math.PI / 8); // tangent handle offset
  
    //flip curve
    let fx, fy;
    if (end[0] - start[0] == 0) {
      fx = 0;
    } else if (end[0] - start[0] > 0) {
      fx = 1;
    } else {
      fx = -1;
    }
    if (end[1] - start[1] == 0) {
      fy = 0;
    } else if (end[1] - start[1] > 0) {
      fy = 1;
    } else {
      fy = -1;
    }
  
    //scale curve when dx or dy is less than the radius
    if (radius == 0) {
      fx = 0;
      fy = 0;
    } else {
      fx *=
        Math.min(Math.abs(start[0] - end[0]), radius) /
        radius;
      fy *=
        Math.min(Math.abs(start[1] - end[1]), radius) /
        radius;
    }
  
    path.moveTo(...start);
    path.lineTo(...[start[0], end[1] - fy * radius]);
    path.bezierCurveTo(
      ...[start[0], end[1] + fy * radius * (dh - 1)],
      ...[start[0] + fx * radius * (1 - dh), end[1]],
      ...[start[0] + fx * radius, end[1]],
    );
    path.lineTo(...end);
    return path;
  }
  
})(window.jQuery, window.Widgets.IndentTree, window.d3, document, window);