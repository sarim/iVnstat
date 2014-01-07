var setupHandlers = function() {
    // replace 35 line of JS code from purecss with 4 lines of jquery
    $("#menuLink").click(function (e){
        e.preventDefault();
        $("#layout,#menu,#menuLink").toggleClass("active");
    })

    $("#menu").on('click', ".choices li", function(e){
        e.preventDefault();
        $(this).parent().find("li").removeClass("pure-menu-selected");
        $(this).addClass("pure-menu-selected");
    
        if ($(this).parent().attr('id') == "ifacelist") {
            var iface = $(this).text().toLowerCase().trim();
            views['showiface'](iface);
        } else {
            var cmd = $(this).text().toLowerCase().trim();
            var func = views[cmd];
            func();
        }
    });
}

var chart = new CanvasJS.Chart("chartContainer",{
	title :{
		text: ""
	},
	axisX: {
        labelFontSize: 12,
        valueFormatString: "hh TT - DD MMM",
	},
	axisY: {
        labelFontSize: 14,
		labelAngle: 314,
		title: "Megabytes",
	},
    toolTip:{
        shared:true
    },
    legend:{
		verticalAlign: "bottom",
		horizontalAlign: "right"
	},
	data: [
    {
        showInLegend: true,
		type: "column",
        name: "Receive",
		dataPoints : []
	},
    {
        showInLegend: true,
		type: "column",
        name: "Transfer",
		dataPoints : []
	}]
});


var views = {
    iface: '',
    showiface: function(ifacename) {
        var cmd = $("#views li.pure-menu-selected").text().toLowerCase().trim();
        views.iface = ifacename;
        $("#cur-iface").html(ifacename);
        var func = views[cmd];
        func();
    },
    common: function(itrFunc) {
        $.get("/vnstat/" + views.iface + "/debug", function(data) {
            $("#chartContainer").show();
            $("#dash").hide();
            chart.options.data[0].dataPoints = [];
            chart.options.data[1].dataPoints = [];
            itrFunc(data);
            chart.render();
        })
    },
    dashboard: function() {
        $.get("/dashboard/" + views.iface, function(data) {
            $("#chartContainer").hide();
            $("#dash").html(data).show();
        });
    },
    months: function() {
        chart.options.title.text = "Monthly Graph";
        chart.options.axisX.valueFormatString = "MMM YYYY";
        views.common(function(data) {
            data.Ifaces.Traffic.Months.Month.forEach(function(a, i) {
                var x = new Date(a.DateVal.Year, a.DateVal.Month -1, 1);
                chart.options.data[0].dataPoints.push({x: x, y: a.Receive/1024});
                chart.options.data[1].dataPoints.push({x: x, y: a.Transfer/1024});
            });
        });
    },
    days: function() {
        chart.options.title.text = "Daily Graph";
        chart.options.axisX.valueFormatString = "DD MMM YYYY";
        views.common(function(data) {
            data.Ifaces.Traffic.Days.Day.forEach(function(a, i) {
                var x = new Date(a.DateVal.Year, a.DateVal.Month -1, a.DateVal.Day);
                chart.options.data[0].dataPoints.push({x: x, y: a.Receive/1024});
                chart.options.data[1].dataPoints.push({x: x, y: a.Transfer/1024});
            });
        });
    },
    tops: function() {
        chart.options.title.text = "Top 10 Days";
        chart.options.axisX.valueFormatString = "DD MMM YYYY";
        views.common(function(data) {
            data.Ifaces.Traffic.Tops.Top.forEach(function(a, i) {
                var x = new Date(a.DateVal.Year, a.DateVal.Month -1, a.DateVal.Day);
                chart.options.data[0].dataPoints.push({x: x, y: a.Receive/1024});
                chart.options.data[1].dataPoints.push({x: x, y: a.Transfer/1024});
            });
        });
    },
    hours: function() {
        chart.options.title.text = "Hourly Graph";
        chart.options.axisX.valueFormatString = "hh TT - DD MMM";
        views.common(function(data) {
            data.Ifaces.Traffic.Hours.Hour.forEach(function(a, i) {
                var x = new Date(a.DateVal.Year, a.DateVal.Month -1, a.DateVal.Day, i);
                chart.options.data[0].dataPoints.push({x: x, y: a.Receive/1024});
                chart.options.data[1].dataPoints.push({x: x, y: a.Transfer/1024});
            });
        });
    },
}

var setupIfaces = function() {
    
    $.get("/list", function(data) {
        data =  JSON.parse(data);
        data.forEach(function(iface) {
            $li = $("<li>");
            $a = $("<a>");
            $a.html(iface);
            $a.appendTo($li);
            $li.appendTo("#ifacelist");
        });
        $first = $($("#ifacelist li")[0]);
        $first.addClass("pure-menu-selected");
        views.showiface(data[0]);
    });
}
setupIfaces();
setupHandlers();
views.dashboard();