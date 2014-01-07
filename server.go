package main

import (
    "fmt"
    "os/exec"
    "github.com/hoisie/web"
    "encoding/xml"
    "encoding/json"
    "strings"
)

const (
    port = "0.0.0.0:7007"
)

type Vnstat struct {
	Ifaces Iface `xml:"interface"`
}

type Iface struct {
	Id  string `xml:"id"`
	Nick string `xml:"nick"`
	Created DateTime `xml:"created"`
	Updated DateTime `xml:"updated"`
    Traffic TrafficType `xml:"traffic"`
}

type DateTime struct {
    DateVal Date `xml:"date"`
    TimeVal Time `xml:"time"`
}

type DateTimeData struct {
    DateVal Date `xml:"date"`
    TimeVal Time `xml:"time"`
    Transfer string `xml:"tx"`
    Receive string `xml:"rx"`
}

type TrafficType struct {
    Total TotalType `xml:"total"`
    Days DaysType `xml:"days"`
    Months MonthsType `xml:"months"`
    Tops TopsType `xml:"tops"`
    Hours HoursType `xml:"hours"`
}

type DaysType struct {
    Day []DateTimeData `xml:"day"`
}

type MonthsType struct {
    Month []DateTimeData `xml:"month"`
}

type TopsType struct {
    Top []DateTimeData `xml:"top"`
}

type HoursType struct {
    Hour []DateTimeData `xml:"hour"`
}

type TotalType struct {
    Transfer string `xml:"tx"`
    Receive string `xml:"rx"`
}

type Date struct {
    Year string `xml:"year"`
    Month string `xml:"month"`
    Day string `xml:"day"`
}

type Time struct {
    Hour string `xml:"hour"`
    Minute string `xml:"minute"`
}

func runcmd (arg ...string) string {
    
    cmd := exec.Command(arg[0], arg[1], arg[2], arg[3])
    out, err := cmd.Output()
    
    if err != nil {
        fmt.Println("Error: %s", err.Error())
        return "" //TODO: Exception
    }

    return string(out)
}

func vnstat(ctx *web.Context, iface string, debug string) string {
    app := "vnstat"
    
    arg0 := "-i"
    arg2 := "--xml"
    
    ctx.SetHeader("Content-Type", "application/json", true)
	
    rawxml := runcmd(app, arg0, iface, arg2)
    
    var q Vnstat
	xml.Unmarshal([]byte(rawxml), &q)
    
    var jsondata []byte
    var err error
    
    if (debug == "debug") {
        jsondata, err = json.MarshalIndent(q, "", "  ")
    } else {
        jsondata, err = json.Marshal(q)
    }

    if err != nil {
        return "Error"
    }
    return string(jsondata)
} 

func dashboard(ctx *web.Context, iface string) string {
    app := "vnstat"
    
    arg0 := "-i"
	
    rawstat := runcmd(app, arg0, iface, "-ru")
    
    return rawstat
}

func ifacelist(ctx *web.Context) string {
    app := "sh"
    arg0 := "-c"
    arg1 := "ls `vnstat --showconfig | grep DatabaseDir | sed -E 's/.* \"(.*)\"/\\1/'`"

    ifaces := strings.TrimSpace(runcmd(app, arg0, arg1, ""))
    ifacelist := strings.Split(ifaces, "\n")

    jsondata, err := json.Marshal(ifacelist)

    if err != nil {
        return "Error"
    }
    
    return string(jsondata)
}

func home(ctx *web.Context) {
    ctx.Redirect(301, "/stat.html");
}

func main() {
    web.Get("/vnstat/(.*)/(.*)", vnstat)
    web.Get("/dashboard/(.*)", dashboard)
    web.Get("/list", ifacelist)
    web.Get("/", home)
    web.Run(port)
}