export default function Tooltip(options) {
  var w=options.width || 300,
    h=options.height || 180;

  var positioner = d3.select(options.positioner)  

  var tooltip=d3.select(options.container)//'#mapHolder'
          .append("div")
            .attr("class","tooltip arrow_box clearfix")
            .style("height", function(){
              return (options.height)+"px";
            })
            .style("width",function(){
              return (options.width)+"px";
            })

  var tooltipTitle=tooltip.append("h1")
        .attr("id","titleTxt")
        .attr("class","tooltip-title");   
  

  var indicator=tooltip.selectAll("div.indicator")
      .data(options.indicators,function(d){
        return d.id;
      })
      .enter()
      .append("div")
        .attr("class","indicator clearfix")



  var value = indicator.append("span")
        .attr("class","value")
        .attr("id",function(d){
          return d.id;
        });

        // indicator.append("span")
        // .attr("class","title")
        // .text(function(d){

        //   return d.title;
        // });

  


  this.hide=function() {
    tooltip.classed("visible", false);
  };

  this.show=function(data,x,y,title) {

    tooltipTitle.text(function(d) {return data.Country} )

    indicator.select("#govLeader")
      .attr("class","value-emphasis")
      .text(function(d){
        //console.log("AAAHHHHHHHHHH",d,this)
        return (data.HeadofGovernment);
      })

    indicator.select("#govParty")
      .text(function(d){ return data.partyOrCoalition;  })
      

    tooltip.style({
      left:(x + 20)+"px",  //+16+options.margins.left
      top:(y + (h/2) + 30)+"px" //+options.margins.top-60
    })
    .classed("visible",true)

 

      
    
  };


}





// var tooltipPlayer=new Tooltip({
//       container:partnershipTimeline.node(),
//       margins:margins,
//       indicators:[
//         {
//           id:"playerRuns",
//           title:"Runs"
//         },
//         {
//           id:"playerBalls",
//           title:"Balls"
//         },
//         /*{
//           id:"playerSR",
//           title:"SR"
//         },*/
//         {
//           id:"playerFourSix",
//           title:"4s/6s"
//         }
//       ]
//     })


