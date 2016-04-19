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
var startDate, endDate, selectedDate; 
var filteredArr;
var mapCirclesArr = [];

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
        o.dRadius = getRadius(o.Deaths)
        o.iRadius = getRadius(o.Injured)
        o.fillColor = "red"
        o.ID = k     

        

        if(o.dRadius < 3){ o.dRadius = 3 }
        if(o.Deaths == 0){ o.fillColor = "yellow" }
    })

    _.forEach(filteredArr, function(o,k){
            o.unixTS = moment(o.manualDate).format("x");
            console.log( o.manualDate, o.unixTS) 
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
    addD3Map(filteredArr)
    
}

function addSlider(){
    var rangeSlider = document.getElementById('sliderHolder');
    var rangeSliderValueElement = document.getElementById('sliderVal');

    var s = parseInt(startDate.unixTS);
    var e = parseInt(endDate.unixTS);
    var stepN = 91.25*24*60*60*1000; //91 close as possibe to a quarter of a year - in millisecs

    noUiSlider.create(rangeSlider, {
        start: [ s ],
        step: stepN,
        range: {
            'min': [  s ],
            'max': [  e ]
        }
    });

    rangeSlider.noUiSlider.on('update', function( values, handle ) {
        rangeSliderValueElement.innerHTML = moment(Math.round(values[handle])).format("DD MMM YYYY");
        updateMapCircles(values[handle], stepN); 
    });

    rangeSlider.noUiSlider.set(stepN)
}

function updateMapCircles(v , t){
    var range = [ v - t, v + t ];
    
    console.log(v)

    _.forEach(mapCirclesArr, function(o){
       var n = o.__data__.unixTS

       if(n > range[0] && n < range[1]){ 
            o.classList.remove("hide")
        } 
        else if(n < range[0] || n > range[1]){ 
            o.classList.add("hide")
        }

        //console.log("n > range[0] = "+(n > range[0])+" --- "+n+" --- n < range[1] =  "+(n < range[1]))
        //console.log(o.__data__.unixTS+"  ---   "+range[0]+" ---  "+v+" --- "+range[1])            
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

    .enter().append("path")
        .attr("class", function(d) { var elClass = "none-europe "; if (d.properties.continent == "Europe"){ elClass = "europe" }; return elClass; }) // + d.id
        .attr("id", function(d){ return "shp_"+ formatStr(d.properties.name) })
        .attr("d", path);

    svg.selectAll("circle")
        .data(filteredArr)
        .enter()
        .append("circle")
        .attr("class", "map-circle hide")
        .attr("dateData", function(d) { return d.compDate; })
        .attr("id",function(d){ return "key_"+d.ID })
        .attr("cx", function(d) { return projection([d.Longitude, d.Latitude])[0]; })
        .attr("cy", function(d) { return projection([d.Longitude, d.Latitude])[1]; })
        .attr("r", function(d) { mapCirclesArr.push(this); return d.dRadius; })
        // .style("display","none")
        .style("fill", function(d) { return d.fillColor; })
        .style("fill-opacity", 0.75);    

        
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
