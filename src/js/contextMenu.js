// contextMenu.js
//define context menu functions
window.Widgets.ContextMenu = {};

(function ($, ns, d3, document, window) {

  ns.createContextMenu = function(
    d,
    menuItems,
    svgId,) {

      ns.menuFactory(d.x, d.y, menuItems, d, svgId);
      //d3.event.preventDefault();

  }

  ns.menuFactory = function(
    x,
    y,
    menuItems,
    data,
    svgId,
  ) {

    d3.select('.contextMenu').remove();

    // Draw the menu
    d3.select(svgId)
      .append('g')
      .attr('class', 'contextMenu')
      .selectAll('tmp')
      .data(menuItems)
      .enter()
      .append('g')
      .attr('class', 'menuEntry')
      .style({ cursor: 'pointer' });

    // Draw menu entries
    d3.selectAll('.menuEntry')
      .append('rect')
      .attr('x', x)
      .attr('y', (d, i) => {
        return y + i * 30;
      })
      .attr('rx', 2)
      .attr('width', 150)
      .attr('height', 30)
      .on('click', (d) => {
        d.action(data);
      });

    d3.selectAll('.menuEntry')
      .append('text')
      .text((d) => {
        return d.title;
      })
      .attr('x', x)
      .attr('y', (d, i) => {
        return y + i * 30;
      })
      .attr('dy', 20)
      .attr('dx', 45)
      .on('click', (d) => {
        d.action(data);
      });

    // Other interactions
    d3.select('body').on('click', () => {
      d3.select('.contextMenu').remove();
    });
    
  }
})(window.jQuery, window.Widgets.ContextMenu, window.d3, document, window);