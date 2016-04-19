export default function addD3AreaChart(data, margin, electionDataByCountry, selectedDate, upDateCountries, upDateTexts, upDateMapView, stopPropagation){

  console.log(upDateTexts)

       var width = 180 ,//- margin.left - margin.right
        height = 420 - margin.top - margin.bottom;

        var parseDate = d3.time.format("%d-%b-%Y").parse;

        var x = d3.scale.linear()
            .range([0, width-(margin.left + margin.right) ]);

        var y = d3.time.scale()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("right")
            .tickSize((width - margin.left - margin.right),0);

        var areaR = d3.svg.area()
            .x0(function(d) { return x(d.rightValue); })
            .x1((width/2)-margin.right)
            .y(function(d) { return y(d.date); });

        var areaL = d3.svg.area()
            .x0(function(d) { return x(d.leftValue * -1); })
            .x1((width/2)-margin.left)
            .y(function(d) { return y(d.date); }); 
           
        var dateDivHolder = d3.select("#areaChartHolder").append("div")            
            .attr("class","date-div")
            .attr("id","dateDiv")
            .style("margin", "0 "+(margin.left + margin.right)+"px 0 0")
            .style("padding", "0 0 12px 0");

        var svg = d3.select("#areaChartHolder").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height) //+ margin.top + margin.bottom
          .append("g")
            .attr("transform", "translate(" + margin.left + ", 0)");//" + margin.top + "

        var keyDivHolder = d3.select("#areaChartHolder").append("div")            
            .attr("class","date-div")
            .attr("id","keyDiv")
            .style("margin-right", (margin.left + margin.right)+"px");      

        data.forEach(function(d) {
             d.date = parseDate(d.date);
          });

        y.domain(d3.extent(data, function(d) { return d.date; }));
        x.domain([-20, d3.max(data, function(d) { return d.close; })]);

        svg.append("path")
            .datum(data)
            .attr("class", "area-right")
            .attr("d", areaR);

        svg.append("path")
            .datum(data)
            .attr("class", "area-left")
            .attr("d", areaL);    

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate( 0 ," + height + ")")
            .call(xAxis);

        svg.append("line")
              .attr("x1", width - margin.right)
              .attr("stroke","#333")
              .attr("x2", -30);

        svg.append("line")
              .attr("x1", width - margin.right)
              .attr("stroke","#333")
              .attr("x2", -30)
              .attr("transform", "translate( 0 , "+ height +" )");      

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
          .selectAll("text")
            .attr("y", -6)
            .attr("x", -18)
            .style("text-anchor", "start");
       
      // .append("text")
      //   .attr("transform", "rotate(-90)")
      //   .attr("y", "200")
      //   .attr("dy", "240")
      //   .style("text-anchor", "end")
      //   .text(" ");


          var focus = svg.append("g")
              .attr("class", "focus");
              
          focus.append("line")
              .attr("x1", width-margin.left-margin.right)
              .attr("x2", 0);//(width-margin.left-margin.right)/2

          // focus.append("rect")
          //     .attr("class", "svg-underlay")
          //     .attr("width", 60)
          //     .attr("height", 18)
          //     .attr("x", width-45)
          //     .attr("y",8)

          // focus.append("text")
          //     .attr("dx", width-margin.left-margin.right)
          //     .attr("dy", 0);

          focus.append("circle")
              .attr("r", 3)
              .attr("transform", "translate( "+ (width-margin.left-margin.right)/2 +" , 0 )");

          //svg.append("text").attr("transform", "translate( 90 , 120)").text(function() { return "Left" });  

          svg.append("rect")
              .attr("class", "svg-overlay")
              .attr("id", "svgOverlay")
              .attr("width", width)
              .attr("height", height)
              .on("mousemove", mousemove);

              //.call(drag);
              //
var start = data[0].date; 
var step = 1000 * 60 * 60 * 24 * 91.25; // approx 91 days - a quarter of year

var offsets = data.map(function(t, i) { return [Date.UTC(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), t.lrCount, t]; });

  function mousemove() {  
          stopPropagation();

          var d = Math.round(y.invert(d3.mouse(this)[1]));
          var obj = offsets[Math.round((d-start)/step)];

          focus.select("g").attr("transform", "translate( 0 ,"+ d3.mouse(this)[1] +" )");
          focus.select("circle").attr("transform", "translate( "+ (width-margin.left-margin.right)/2 +" , "+ d3.mouse(this)[1] +" )");
          //focus.select("text").attr("transform", "translate( 0 , "+ (d3.mouse(this)[1] )+" )").text(function() { return moment(obj[2].compDate).format('MMM YYYY') });  
          //focus.select("rect").attr("transform", "translate( 0 , "+ (d3.mouse(this)[1] - 20 )+" )");
          focus.select("line").attr("transform", "translate( 0 , "+ (d3.mouse(this)[1])+" )");
          //focus.select(".x").attr("transform", "translate(" + x(d[0]) + ",0)");
          //focus.select(".y").attr("transform", "translate(0," + y(d[1]) + ")");
          svg.selectAll(".x.axis path").style("fill-opacity", Math.random()); // XXX Chrome redraw bug

          upDateMapView(obj[2].compDate)
          upDateTexts(obj[2])

        }
    
}