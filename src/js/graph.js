// OS Threat graph.js
//define context menu functions
window.Widgets.Graph = {};

(function($, ns, d3, contextMenuNs, browserNs, document, window) {





    //------------------------------------------
  // Adjaceny List Class
  //-------------------------------------------
  class Graph {
    constructor() {
      this.t = new Map();
    }
    addEdge(node1, node2) {
      const s = this.t.get(node1);
      if (s == null) this.t.set(node1, new Set([node2]));
      else s.add(node2);
    }
    getAdjacencies(node) {
      var z = this.t.get(node);
      if (z == null) {
        z = new Set();
      }
      return z;
    }
    *dir(node, path = Array(), visited = new Set()) {
      yield [...path, node];
      path.push(node);
      visited.add(node);
      for (const adj of this.getAdjacencies(node)) {
        if (!visited.has(adj)) {
          yield* this.dir(adj, path, visited);
        }
      }
      path.pop();
    }
    *dirs(nodes) {
      for (const node of nodes) {
        yield* this.dir(node);
      }
    }
  }


  //----------------------------------------
  // key id functions
  ns.getLinkId = function(d, i) {
    console.log(['getLinkId', d, i]);
    return d.source.id + '-' + d.target.id;
  };
  ns.getNodeId = function(d, i) {
    console.log(['getNodeId', d, i]);
    return d.id;
  };

  //------------------------------------------
  // visualisation component
  //-----------------------------------------

  // A. Initialise the object
  ns.initSVG = function($component, data, inputOptions) {
    console.group('initSVG');
    console.log(['config', data, inputOptions]);
    
    //copy inputOptions into options
    let options = Object.assign({}, inputOptions);

    if (options.theme === 'light') {
        options.theme = options.light_theme;
    } else {
        options.theme = options.dark_theme;
    }

    options.steps = ["initSVG"];

    options.$object_form = $component.find('#promo_panel');
    options.$working_svg = $component.find('#scratch_panel');
    //
    // Step 1: Setup the 3 svg's and the tooltip
    options.promotable_svg = d3.select('#promo_panel')
      .append('svg')
      .attr('width', browserNs.ow(options.$object_form) )
      .attr('height', browserNs.oh(options.$object_form))
      .attr('class', 'promotable_svg');
    options.scratch_svg = d3.select('#scratch_panel')
      .append('svg')
      .attr('width', browserNs.ow(options.$working_svg) )
      .attr('height', browserNs.oh(options.$working_svg))
      .attr('class', 'scratch_svg');
    options.tooltip = d3
      .select('body')
      .append('div')
      .style("z-index", "10")
      .attr('class', 'workingTooltip')
      .style('display', 'block')
      .style("position", "absolute")
      .style("background-color", options.theme.tooltip.fill)
      .style("border", "solid")
      .style("border-width",  options.theme.tooltip.stroke)
      .style("border-color",  options.theme.tooltip.scolour)
      .style("border-radius",  options.theme.tooltip.corner)
      .style("padding",  options.theme.tooltip.padding)
      .style('opacity', 0);

    // Step 2: Setup the 3 rectangles
    options.promotable_rect = options.promotable_svg
      .append('rect')
      .attr('width', browserNs.ow(options.$object_form) )
      .attr('height', browserNs.oh(options.$object_form))
      .attr('x', 0)
      .attr('y', 0)
      .attr('stroke', options.theme.svgBorder)
      .attr('fill', options.theme.promoFill);
    options.scratch_rect = options.scratch_svg
      .append('rect')
      .attr('width', browserNs.ow(options.$working_svg) )
      .attr('height', browserNs.oh(options.$working_svg))
      .attr('x', 0)
      .attr('y', 0)
      .attr('stroke', options.theme.svgBorder)
      .attr('fill', options.theme.scratchFill);
    options.promotable_label = options.promotable_svg
      .append('g')
      .attr('transform', 'translate(' + 10 + ',' + 20 + ')')
      .append('text')
      .text('Promotable')
      .style('fill', options.theme.svgName);
    options.scratch_label = options.scratch_svg
      .append('g')
      .attr('transform', 'translate(' + 10 + ',' + 20 + ')')
      .append('text')
      .text('Scratch Pad')
      .style('fill', options.theme.svgName);

    // Step 3. Connect the svg's to the function object and set the zoom
    options.promo_svg = options.promotable_svg
      .call(
        d3.zoom().on('zoom', function() {
            options.promotable_svg.attr(
            'transform',
            event.transform,
          );
        }),
      )
      .append('g');
    options.scratch_svg = options.scratch_svg
      .call(
        d3.zoom().on('zoom', function() {
            options.scratch_svg.attr('transform', event.transform);
        }),
      )
      .append('g');

    // Append the Arrowhead in Promo and Scratch SVG's
    options.promo_svg = options.promo_svg
      .append('defs')
      .append('marker')
      .attr('id', 'parrowhead')
      .attr('viewBox', '-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
      .attr('refX', 50) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', options.checkColour)
      .style('stroke', 'none');

    options.scratch_svg = options.scratch_svg
      .append('defs')
      .append('marker')
      .attr('id', 'sarrowhead')
      .attr('viewBox', '-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
      .attr('refX', 50) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', options.checkColour)
      .style('stroke', 'none');

    // Step 4. Setup the data, first separate the nodes and edges into two groups
    console.groupEnd();
    return options;
  };

  //
  //
  
  // B. Update Data, Simulations and Drive Show Graph
  ns.updateGraph = function(graph, options) {
    console.group('updateGraph');
    // console.log('inputOptionsh->', inputOptions);

    // let options = Object.assign({}, inputOptions);

    options.steps.push('updateGraph');
    // 1. Setup variables and define promotable types
    options.prom_types = [
      'incident',
      'task',
      'impact',
      'event',
      'sighting',
    ];
    let nodes = graph.nodes;
    let edges = graph.edges;

    options.split = {};
    options.split.promo = {};
    options.split.promo.nodes = [];
    options.split.promo.edges = [];
    options.split.scratch = {};
    options.split.scratch.nodes = [];
    options.split.scratch.edges = [];
    options.adjacency = new Graph();
    options.prom_node_IDs = [];

    // 2. Fill adjacency list with edges
    edges.forEach(function(edge) {
        options.adjacency.addEdge(edge['source'], edge['target']);
    });
    //3. Find first the promotable node ID's and collect all sub-graphs into promID's
    nodes.forEach(function(node) {
      if (options.prom_types.includes(node.type)) {
        options.prom_node_IDs.push(node.id);
      }
    });
    options.prom_IDs = Array.from(
        options.adjacency.dirs(options.prom_node_IDs),
      (path) => path.at(-1),
    );
    // 4. Now split the Graphs and update the
    nodes.forEach(function(node) {
      if (options.prom_IDs.includes(node.id)) {
        options.split.promo.nodes.push(node);
      } else {
        options.split.scratch.nodes.push(node);
      }
    });
    edges.forEach(function(edge) {
      if (
        options.prom_IDs.includes(edge.source) &&
        options.prom_IDs.includes(edge.target)
      ) {
        options.split.promo.edges.push(edge);
      } else {
        options.split.scratch.edges.push(edge);
      }
    });
    // 5. Setup the namesspace data
    options.rawData = graph;

    console.log('options->', options);
    console.log('options.split->', options.split);
    console.log('options.split.scratch->', options.split.scratch);
    console.log('options.split.promo->', options.split.promo);

    console.groupEnd();
    return options;
  };

  // Step 3. Show Graph
  ns.showGraphs = function(options) {
    console.group('showGraphs');
    console.log('Showing the Graph');
    console.log('options->', options);
    options.steps.push('showGraphs');
    // Initialize the links, EdgePaths
    options.promoLink = options.promo_svg
      .selectAll('.plinks')
      .data(options.split.promo.edges)
      .join('line')
      .attr('class', 'plinks')
      .attr('source', (d) => d.source)
      .attr('target', (d) => d.target)
      .attr('stroke-width', 0.75)
      .attr('stroke', 'grey')
      .attr('marker-end', 'url(#parrowhead)'); //The marker-end attribute defines the arrowhead or polymarker that will be drawn at the final vertex of the given shape.

    options.scratchLink = options.scratch_svg
      .selectAll('.slinks')
      .data(options.split.scratch.edges)
      .join('line')
      .attr('class', 'slinks')
      .attr('source', (d) => d.source)
      .attr('target', (d) => d.target)
      .attr('stroke-width', 0.75)
      .attr('stroke', 'grey')
      .attr('marker-end', 'url(#sarrowhead)'); //The marker-end attribute defines the arrowhead or polymarker that will be drawn at the final vertex of the given shape.

    options.promoEdgepaths = options.promo_svg
      .selectAll('.pedgepath') //make path go along with the link provide position for link labels
      .data(options.split.promo.edges)
      .join('path')
      .attr('class', 'pedgepath')
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('id', function(d, i) {
        return 'pedgepath' + i;
      })
      .style('pointer-events', 'none');

    options.scratchEdgepaths = options.scratch_svg
      .selectAll('.sedgepath') //make path go along with the link provide position for link labels
      .data(options.split.scratch.edges)
      .join('path')
      .attr('class', 'sedgepath')
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('id', function(d, i) {
        return 'sedgepath' + i;
      })
      .style('pointer-events', 'none');

    options.promoEdgelabels = options.promo_svg
      .selectAll('.pedgelabel')
      .data(options.split.promo.edges)
      .join('text')
      .style('pointer-events', 'none')
      .attr('class', 'pedgelabel')
      .attr('id', function(d, i) {
        return 'pedgelabel' + i;
      })
      .attr('font-size', 18)
      .attr('fill', options.theme.edges);

    options.scratchEdgelabels = options.scratch_svg
      .selectAll('.sedgelabel')
      .data(options.split.scratch.edges)
      .join('text')
      .style('pointer-events', 'none')
      .attr('class', 'sedgelabel')
      .attr('id', function(d, i) {
        return 'sedgelabel' + i;
      })
      .attr('font-size', 18)
      .attr('fill', options.theme.edges);

    options.promoEdgelabels
      .append('textPath') //To render text along the shape of a <path>, enclose the text in a <textPath> element that has an href attribute with a reference to the <path> element.
      .attr('xlink:href', function(d, i) {
        return '#pedgepath' + i;
      })
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .attr('startOffset', '50%')
      .text((d) => d.name);

    options.scratchEdgelabels
      .append('textPath') //To render text along the shape of a <path>, enclose the text in a <textPath> element that has an href attribute with a reference to the <path> element.
      .attr('xlink:href', function(d, i) {
        return '#sedgepath' + i;
      })
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .attr('startOffset', '50%')
      .text((d) => d.name);

    // Initialize the nodes with attached image, changed to join data
    // add hover over effect
    // for promo
    options.promoNode = options.promo_svg
      .append('g')
      .selectAll('.pnodes')
      .data(options.split.promo.nodes, (d) => d.id)
      .join('image')
      .attr('class', 'pnodes')
      .attr('xlink:href', function(d) {
        return (
          options.prefix + options.shape + d.icon + '.svg'
        );
      })
      .attr('width', options.icon_size + 5)
      .attr('height', options.icon_size + 5);
    // .on('mouseover', function(d) {
    //   d3.select(this)
    //     .transition()
    //     .duration(options.duration)
    //     .attr('width', 70)
    //     .attr('height', 70);
    // })
    // .on('mouseout', function(d) {
    //   d3.select(this)
    //     .transition()
    //     .duration(options.duration)
    //     .attr('width', function(d) {
    //       return options.radius;
    //     })
    //     .attr('height', function(d) {
    //       return options.radius;
    //     });
    // })
    // .on('mouseover.tooltip', function(d) {
    //   ns.tooltip
    //     .transition()
    //     .duration(options.duration)
    //     .style('opacity', 0.8);
    //   ns.tooltip
    //     .html(
    //       '<h1>' +
    //         d.heading +
    //         '</h1>' +
    //         '<p> ' +
    //         d.description +
    //         '</p>',
    //     )
    //     .style('left', d3.event.pageX + 'px')
    //     .style('top', d3.event.pageY + 10 + 'px');
    // })
    // .on('mouseout.tooltip', function() {
    //   ns.tooltip
    //     .transition()
    //     .duration(100)
    //     .style('opacity', 0);
    // })
    // .on('mousemove', function() {
    //   ns.tooltip
    //     .style('left', d3.event.pageX + 'px')
    //     .style('top', d3.event.pageY + 10 + 'px');
    // })
    // .call(
    //   d3
    //     .drag() //sets the event listener for the specified typenames and returns the drag behavior.
    //     .on('start', pDragstarted) //start - after a new pointer becomes active (on mousedown or touchstart).
    //     .on('drag', pDragged) //drag - after an active pointer moves (on mousemove or touchmove).
    //     .on('end', pDragended), //end - after an active pointer becomes inactive (on mouseup, touchend or touchcancel).
    // );

    // for scratch
    options.scratchNode = options.scratch_svg
      .append('g')
      .selectAll('.snodes')
      .data(options.split.scratch.nodes, (d) => d.id)
      .join('image')
      .attr('class', 'snodes')
      .attr('xlink:href', function(d) {
        return (
          options.prefix + options.shape + d.icon + '.svg'
        );
      })
      .attr('width', options.icon_size + 5)
      .attr('height', options.icon_size + 5);
    // .on('mouseover', function(d) {
    //   d3.select(this)
    //     .transition()
    //     .duration(options.duration)
    //     .attr('width', 70)
    //     .attr('height', 70);
    // })
    // .on('mouseout', function(d) {
    //   d3.select(this)
    //     .transition()
    //     .duration(options.duration)
    //     .attr('width', function(d) {
    //       return options.icon_size;
    //     })
    //     .attr('height', function(d) {
    //       return options.icon_size;
    //     });
    // })
    // .on('mouseover.tooltip', function(d) {
    //   ns.tooltip
    //     .transition()
    //     .duration(options.duration)
    //     .style('opacity', 0.8);
    //   ns.tooltip
    //     .html(
    //       '<h1>' +
    //         d.heading +
    //         '</h1>' +
    //         '<p> ' +
    //         d.description +
    //         '</p>',
    //     )
    //     .style('left', d3.event.pageX + 'px')
    //     .style('top', d3.event.pageY + 10 + 'px');
    // })
    // .on('mouseout.tooltip', function() {
    //   ns.tooltip
    //     .transition()
    //     .duration(100)
    //     .style('opacity', 0);
    // })
    // .on('mousemove', function() {
    //   ns.tooltip
    //     .style('left', d3.event.pageX + 'px')
    //     .style('top', d3.event.pageY + 10 + 'px');
    // })
    // .call(
    //   d3
    //     .drag() //sets the event listener for the specified typenames and returns the drag behavior.
    //     .on('start', sDragstarted) //start - after a new pointer becomes active (on mousedown or touchstart).
    //     .on('drag', sDragged) //drag - after an active pointer moves (on mousemove or touchmove).
    //     .on('end', sDragended), //end - after an active pointer becomes inactive (on mouseup, touchend or touchcancel).
    // );

    
    //create zoom handler  for each
    let pZoom_handler = d3.zoom().on('zoom', function(options) { pzoom_actions(options) });
    let sZoom_handler = d3.zoom().on('zoom', function(options) { szoom_actions(options) });

    //specify what to do when zoom event listener is triggered foreach
    function pzoom_actions(options) {
        options.promo_svg.attr('transform', d3.event.transform);
    }
    function szoom_actions(options) {
        options.scratch_svg.attr('transform', d3.event.transform);
    }

    //add zoom behaviour to the svg element
    //same as svg.call(zoom_handler);
    pZoom_handler(options.promo_svg);
    sZoom_handler(options.scratch_svg);

    //The simulation is temporarily “heated” during interaction by setting the target alpha to a non-zero value.
    function pDragstarted(d) {
      if (!d3.event.active)
      options.promotable_sim.alphaTarget(0.3).restart(); //sets the current target alpha to the specified number in the range [0,1].
      d.fy = d.y; //fx - the node’s fixed x-position. Original is null.
      d.fx = d.x; //fy - the node’s fixed y-position. Original is null.
    }

    //When the drag gesture starts, the targeted node is fixed to the pointer
    function pDragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    //the targeted node is released when the gesture ends
    function pDragended(d) {
      if (!d3.event.active)
        options.promotable_sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function sDragstarted(d) {
      if (!d3.event.active)
        options.scratch_sim.alphaTarget(0.3).restart(); //sets the current target alpha to the specified number in the range [0,1].
      d.fy = d.y; //fx - the node’s fixed x-position. Original is null.
      d.fx = d.x; //fy - the node’s fixed y-position. Original is null.
    }

    //When the drag gesture starts, the targeted node is fixed to the pointer
    function sDragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    //the targeted node is released when the gesture ends
    function sDragended(d) {
      if (!d3.event.active) 
        options.scratch_sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    console.groupEnd();
    return options;
  };

  
  // Step 4: Simulate Graph
  ns.simGraph = function(data, options) {
    console.group('simGraph');
    console.log('Simulating Graph');
    // console.log('inputOptions->', inputOptions);
    // let options = Object.assign({}, inputOptions);
    console.log('options->', options);
    options.steps.push('simGraph');
    console.log('options.split.scratch->', options.split.promo.edges);
    // Step 6. Setup the simulations
    // first the variables centreStrength
    options.pforceNode = d3.forceManyBody();
    options.sforceNode = d3.forceManyBody();
    options.pforceLink = d3
      .forceLink(options.split.promo.edges)
      .id(function (d) {
        console.log('pforceLink->', d);
        return d.id
      }) // (d) => d.data.id
      .distance(4 * options.icon_size);
    options.sforceLink = d3
      .forceLink(options.split.scratch.edges)
      .id((d) => d.id)
      .distance(4 * options.icon_size);
    options.sforceCentre = d3.forceCenter(
      options.working_width / 2,
      options.svg_height / 4,
    );
    options.pforceCentre = d3.forceCenter(
      options.working_width / 2,
      options.svg_height / 4,
    );
    if (options.nodeStrength !== undefined)
      options.pforceNode.strength(options.nodeStrength);
    if (options.nodeStrength !== undefined)
      options.sforceNode.strength(options.nodeStrength);
    if (options.linkStrength !== undefined)
      options.pforceLink.strength(options.linkStrength);
    if (options.linkStrength !== undefined)
      options.sforceLink.strength(options.linkStrength);
    if (options.centreStrength !== undefined)
      options.sforceCentre.strength(options.centreStrength);
    if (options.centreStrength !== undefined)
      options.pforceCentre.strength(options.centreStrength);

    console.log(
      'options.split.promo.nodes',
      options.split.promo.nodes,
    );
    console.log(
      'options.split.promo.edges',
      options.split.promo.edges,
    );
    console.log(
      'options.split.scratch.nodes',
      options.split.scratch.nodes,
    );
    console.log(
      'options.split.scratch.edges',
      options.split.scratch.edges,
    );
// 

    options.promotable_sim = d3
      .forceSimulation(browserNs.ow(options.$object_form), browserNs.oh(options.$object_form))
      .nodes(options.split.promo.nodes)
    //   .on('end', function() {
    //     console.log(["promotable_sim",this]);
    //         this.force('link',   options.pforceLink)
    //         .force('charge',   options.pforceNode)  
    //         .force('center',   options.pforceCentre);
    //   });
      .force('link', options.pforceLink)
      .force('charge', options.pforceNode)
      .force('center', options.pforceCentre)
      .on('tick', function() {
        // console.log(['promotable_sim ticked',this, options.promo_svg
        // .selectAll('.plinks')]);
        // options.promo_svg
        options.promoLink
          // .selectAll('.plinks')
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y);
  
        // options.promo_svg
        options.promoNode
          // .selectAll('.pnodes')
          // .attr('x', (d) => d.x - 6 / 2)
          .attr('x', function(d) { 
            // console.log('promoNode->', d)
            return d.x - 6 / 2;
          })
          .attr('y', (d) => d.y - 6 / 2);
  
        // options.promo_svg.selectAll('.pedgepath')
        options.promoEdgepaths
          .attr('d',
            function(d) {
              //console.log('pedgepath->', d);
              return (
                'M ' +
                d.source.x +
                ' ' +
                d.source.y +
                ' L ' +
                d.target.x +
                ' ' +
                d.target.y
              );
          },
          // (d) =>
          //   'M ' +
          //   d.source.x +
          //   ' ' +
          //   d.source.y +
          //   ' L ' +
          //   d.target.x +
          //   ' ' +
          //   d.target.y,
        );
      }); //use simulation.on to listen for tick events as the simulation runs.

      

    options.scratch_sim = d3
      .forceSimulation(browserNs.ow(options.$working_svg) ,browserNs.oh(options.$working_svg))
      .nodes(options.split.scratch.nodes)
    //   .on('end', function() {
    //     console.log(this);
    //     console.log(["scratch_sim",this]);
    //     this.force('link', options.sforceLink)
    //         .force('charge', options.sforceNode)
    //         .force('center', options.sforceCentre);
    //   });
      .force('link', options.sforceLink)
      .force('charge', options.sforceNode)
      .force('center', options.sforceCentre)
      .on('tick', function() {
        // options.scratch_svg
        //   .selectAll('.slinks')
        options.scratchLink
          // .attr('d',
          //   function(d) {
              // console.log('slinks->', d);})
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y);
  
        // options.scratch_svg
        //   .selectAll('.snodes')
        options.scratchNode
          .attr('x', (d) => d.x - options.radius / 2)
          .attr('y', (d) => d.y - options.radius / 2);
  
        // options.scratch_svg.selectAll('.sedgepath')
        options.scratchEdgepaths
          .attr('d',
            function(d) {
              // console.log('sedgepath->', d);
              return (
                'M ' +
                d.source.x +
                ' ' +
                d.source.y +
                ' L ' +
                d.target.x +
                ' ' +
                d.target.y
              );
          },
          // (d) =>
          //   'M ' +
          //   d.source.x +
          //   ' ' +
          //   d.source.y +
          //   ' L ' +
          //   d.target.x +
          //   ' ' +
          //   d.target.y,
        );
      });

    // 7. Now show split graphs
    console.groupEnd();
    return options;
  };

  //------------------------------------------
  // Reference Component Namesapce
  //-----------------------------------------
  //namespace for all of the object functions and variables
  //will be passed to the declared function
  // window.workP = {};
  // (function(ns) {
  //   console.group('testObject');

  //   //declare a variable for this namespace
  //   ns.testValue = 'value';

  //   ns.testFunction = function() {
  //     return 'function value';
  //   };
  //   console.log(['testObject namespace contents', ns]);

  //   console.groupEnd();
  // })(window.testObject); //execte declaration and pass namespace

  // console.log([
  //   'testObject',
  //   testObject.testValue,
  //   testObject.testFunction(),
  // ]);


})(window.jQuery, window.Widgets.Graph, window.d3, window.Widgets.ContextMenu, window.Widgets.Browser, document, window);