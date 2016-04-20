import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'
import share from './lib/share'
import mapData from './data/subunits110m.json!json' // lo quality view - more detailed json in data folder if needed
import d3 from 'd3'
import lodash from 'lodash'
import topojson from 'topojson'
import moment from 'moment'
import twix from 'twix'
import 'moment/locale/en-gb'

import Tooltip from './components/Tooltip'

import nouislider from 'nouislider'
//import addD3AreaChart from './components/addD3AreaChart' 

var _ = lodash;
var noUiSlider = nouislider;

var margin = {top: 90, right: 20, bottom: 36, left: 20}; // set some globals
var startDate, endDate, selectedDate, slider; 
var filteredArr;
var mapCirclesArr = [];
var unixDay = 24*60*60*1000;
var stepN = 91.25*unixDay; //91.25 close as possibe to a quarter of a year - in millisecs

var minRadius = 9;

export function init(el, context, config, mediator) {
    el.innerHTML = mainHTML.replace(/%assetPath%/g, config.assetPath);

    reqwest({
        url: 'https://interactive.guim.co.uk/docsdata-test/1ih8Inp5LRR3mTLJwaquuJ3D6auX82yyCKKzvICgThdQ.json',
        type: 'json',
        crossOrigin: true,
        success: (resp) => initData(resp)
    });

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}

function initData(r){

    filteredArr = _.filter(r.sheets.Sheet1, function(o) { return o.Category=="M"; });

    _.forEach(filteredArr, function(o,k){
        o.manualDate = new Date(manualDateFormat(o.Date))
        o.compDate = moment(o.manualDate).format("YYYYMMDD")
        o.dRadius = getRadius(o.Deaths) + minRadius
        o.iRadius = getRadius(o.Injured) + minRadius
        o.fillColor = "red"
        o.ID = k    

        if(o.dRadius < 3){ o.dRadius = 3 }
        if(o.Deaths == 0){ o.fillColor = "yellow" }

    })

    _.forEach(filteredArr, function(o,k){
            o.unixTS = moment(o.manualDate).format("x");
    })

    initDates()

    buildView(filteredArr)
}

function initDates(){
    startDate = _.minBy(filteredArr, function(o) { return o.unixTS; });
    endDate = _.maxBy(filteredArr, function(o) { return o.unixTS; }); 
    console.log(startDate.unixTS,endDate.unixTS) 
}

function buildView(filteredArr){
    //el.querySelector('.test-msg').innerHTML = ("hello")
    addSlider(); 
    addD3Map(filteredArr);
    addListeners();
}

function addSlider(){
    slider = document.getElementById('sliderHolder');
    var sliderValueElement = document.getElementById('sliderVal');

    var s = parseInt(startDate.unixTS);
    var e = parseInt(endDate.unixTS);

    noUiSlider.create(slider, {
        start: [ s ],
        step: stepN,
        range: {
            'min': [ s ],
            'max': [ e ]
        }
    });

    slider.noUiSlider.on('update', function( values, handle ) {
        sliderValueElement.innerHTML = moment(Math.round(values[handle])).format("DD MMM YYYY");
        updateMapCircles(values[handle], stepN); 
    });
}

function toggleGlass(){
    var glass = document.getElementById('playGlass');   

    glass.transition()
        .duration(500)
        .style('opacity', 0);

    setSlider();    
}

function setSlider(){
    var currVal = slider.noUiSlider.get();
    var v = parseInt(currVal)
    var s = parseInt(stepN)
    var n = v+s
    var dd = n.toFixed(2);
    var stop = parseInt(endDate.unixTS).toFixed(2);
    var start = parseInt(startDate.unixTS).toFixed(2); 
 
    slider.noUiSlider.set(dd)

    if (dd <= stop){ setTimeout(setSlider, 500) } 

    if (dd > stop){ clearTimeout(setSlider);   }  // resetSlider()

    console.log("new "+dd )
}

function resetSlider(){
    var start = parseInt(startDate.unixTS).toFixed(2);
    slider.noUiSlider.set(slider.noUiSlider.set(start) );
}

function updateMapCircles(v , t){
    var range = [ v - t, v + t ];

    _.forEach(mapCirclesArr, function(o){
       var n = o.__data__.unixTS
       var circ = d3.select(o)
       if(n > range[0] && n < range[1]){ 
            circ.transition()
                .duration(500)
                .style('opacity', 0.5);
            //o.classList.remove("hide")
        } 
        else if(n < range[0] || n > range[1]){ 
            circ.transition()
                .duration(500)
                .style('opacity', 0);
            //o.classList.add("hide")
        }

    })
}

function addD3Map(filteredArr){
    var emptyDiv = document.getElementById('mapHolder');
    emptyDiv.innerHTML = " ";

    var padding = {top:0, right:0, bottom:0, left:0 } // left:220
    
    var width = 940, //320
        height = 480; //320   

    var projection = d3.geo.mercator()
        .center([20, 53]) //20, 50
        .rotate([4.4, 0]) //4.4, 0
        .scale(980 * 0.15) //650 * 0.7
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);    

    var svg = d3.select("#mapHolder").append("svg")
        .attr("width", width - padding.left)
        .attr("height", height + margin.top);

        //new Tooltip({ container: '#mapHolder', positioner: this.id, margins:margin, dataObj:countryD, title: true, indicators:[

    var tooltipPartnership=new Tooltip({ container: '#mapHolder', margins:margin, title: false, indicators:[
                {
                  title:"Leader",
                  id:"govLeader"
                },
                {
                  title:"Party",
                  id:"govParty"
                }
            ] })    

    svg.selectAll(".subunit")
        //**************
        // important - make sure the data structure in the subunits.json file is the same as below
        //**************
        .data(topojson.feature(mapData, mapData.objects.subunits).features)
        .attr("id","land")

    .enter().append("path")
        .attr("class", "land-mass" ) // + d.id
        .attr("id", function(d){ return "shp_"+ formatStr(d.properties.name) })
        .attr("d", path);

    var mapCircles = svg.append('g')

    mapCircles.selectAll("circle")
        .data(filteredArr)
        .enter()
        .append("circle")
        .attr("class", "map-circle")
        .attr("dateData", function(d) { return d.compDate; })
        .attr("id",function(d){ return "key_"+d.ID })
        .attr("cx", function(d) { return projection([d.Longitude, d.Latitude])[0]; })
        .attr("cy", function(d) { return projection([d.Longitude, d.Latitude])[1]; })
        .attr("r", function(d) { mapCirclesArr.push(this); return d.dRadius; })
        
        .style("fill", function(d) { return d.fillColor; })
        .style("opacity",0)      

    var playButton = svg.append('g')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("id","playGlass")
        //.style("display","none")
        
    playButton.append("rect")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)    
        .attr("fill","black")
        .attr("fill-opacity",0.25) 

    playButton.append("circle")
        .attr("cx", (width/2)-30)
        .attr("cy", (height/2)-30)
        .attr("r", 30)
        .attr("fill","black")  

    playButton.append("path")
        .attr("d", "M 15,30, L 15,46, L 30,39 Z")
        .style("stroke", "black")  // colour the line
        .style("fill", "white")     // remove any fill colour
        .attr("transform","translate("+((width/2)-60) +","+ ((height/2)-60) +")")
       // .attr("transform", "translate("+width/2 +","+ height/2+")")


        setInitView()            
        
}




function setInitView(){
    updateMapCircles( startDate.unixTS, 100) 
    addListeners()
}

function addListeners(){
    document.getElementById('playGlass').addEventListener('click', function(){
        setSlider()
        //var currVal = ( slider.noUiSlider.get() );
    });
}

function formatStr(s){
    s = s.replace(/\./g, '-');
    s = s.replace(/\s/g, '-');

    return s;
}

function manualDateFormat(s){
    var a = s.split("/"); 
    s = a[1]+"-"+a[0]+"-"+a[2]

    return(s) 
}

function getRadius(n){
    var min = 1;
    var max = 50;

    if(isNaN(n)){ n = 0 };

    return (Math.ceil(n/max));
}

 // svg.selectAll(".europe")
     //     .on( "mousemove",function(){
     //          var x=d3.mouse(this)[0];
     //          x = Math.min(width-margin.right,x);

     //          var y=d3.mouse(this)[1];
     //          y = Math.min(height-margin.top,y);

     //          var countryD = findCountry(this)

     //          tooltipPartnership.show(countryD,x,y,countryD.Country);

     //        })
     //        .on("mouseleave",function(d){
   
     //          tooltipPartnership.hide();
     //        }) 
