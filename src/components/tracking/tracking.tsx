"use client"
 import { TractorDetails } from "@/components/ecommerce/TractorDetails";
 import React, { useEffect, useState } from "react";
 // import Flatpickr from "react-flatpickr";
 import 'flatpickr/dist/themes/material_blue.css';
 // import LiveMap from "@/components/map/LiveMap";
 // import PathMap from "@/components/map/pathMap";
 import dynamic from "next/dynamic";
 import { Box, Card, CardContent, Typography } from "@mui/material";


 const LiveMap = dynamic(() => import('@/components/map/LiveMap'), { ssr: false });
 const PathMap = dynamic(() => import('@/components/map/pathMap'), { ssr: false });
 const Flatpickr = dynamic(() => import('react-flatpickr'), { ssr: false });

interface tractor_props{
    tractor_id:string
}

 interface Data {
 TIME: string;
 DEVICE_ID: string;
 LATITUDE:string;
 LONGITUDE:string
 FUEL_LEVEL: string;
 SPEED: string;
 ENGINE_RPM: string;
 IGNITION:string;
 }
 interface ChartData {
 name: string;
 TIME: string;
 LATITUDE:string;
 LONGITUDE:string;
 ALTITUDE: string;
 DEVICE_ID: string;
 FUEL_LEVEL: number;
 SPEED: number;
 ENGINE_RPM: number;
 IGNITION:number;
 }

 const Tracking:React.FC<tractor_props>=({tractor_id})=> {
 const [newData, setNewData] = useState<Data>(Object);
 const[ date, setDate] = useState<string>('')
 const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
 const [status, setStatus] = useState<string>("Stopped");
 const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<string>('');

 const getStatusStyle = (status: string) => {
 switch (status) {
 case 'Running':
 return { backgroundColor: '#4caf50', color: 'white' }; // Green for Running
 case 'Ignition On':
 return { backgroundColor: '#FFD300', color: 'white' };
 case 'Cranked & Halted':
 return { backgroundColor: '#FFA500', color: 'white' };
 case 'Stopped':
 return { backgroundColor: '#f44336', color: 'white' }; // Red for Stopped
 default:
 return { backgroundColor: '#9e9e9e', color: 'white' }; // Grey for unknown status
 }
 };

 const handleDateChange = (date: any) => {
 const selectedDate = new Date(date[0]); // Get the selected date
 selectedDate.setDate(selectedDate.getDate() + 1); // Increase by 1 day
 
 // Format the date as YYYY-MM-DD
 const newDate = selectedDate.toISOString().split('T')[0]; 
 
 console.log(newDate);
 setDate(newDate); // Set the updated date
 };
 
 useEffect(() => {
 // You can also check and update the date if necessary
 setToday(new Date().toISOString().split('T')[0]);
 console.log(new Date().toISOString().split('T')[0])
 }, []);
 function addTimeToCurrentTime(currentTime:string) {
 const additionalTime = "5:30"
 const time = currentTime.match(/(\d{2}:\d{2}:\d{2})/)?.[0];
 if (!time) {
 return "Error: Invalid time format";
 }
 const [hours, minutes, seconds] = time.split(":").map(Number);
 const [addHours, addMinutes] = additionalTime.split(":").map(Number);
 let newMinutes = minutes + addMinutes;
 let newHours = hours + addHours + Math.floor(newMinutes / 60); 
 newMinutes = newMinutes % 60; 
 newHours = newHours % 24;
 let newSeconds = seconds;
 const formattedTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;
 
 return formattedTime;
 } 

 const timeToSeconds = (time: string): number => {
 const [hours, minutes, seconds] = time?.split(':')?.map(Number);
 return hours * 3600 + minutes * 60 + seconds;
 };
 
 let allData : ChartData[] = []

 React.useEffect(() => {
 const socket = new WebSocket("wss://fdcserver.escortskubota.com/ws/"); // Change to your WebSocket server
 socket.onopen = () => {
 console.log("Connected to WebSocket");
 };
 
 socket.onmessage = (event) => {
 try {
 console.log("Event data",event?.data)
 const data = JSON.parse(event?.data);
 if (data && 
data.DEVICE_ID==`${tractor_id} `&&
 data.DEVICE_ID && 
 data.LATITUDE !== "0.000000" &&
 data.LONGITUDE !== "0.000000" &&
 !isNaN(parseFloat(data.ENGINE_RPM)) &&
 !isNaN(parseFloat(data.FUEL_LEVEL)) &&
 !isNaN(parseFloat(data.SPEED))) {
 
 const commingData = 
 {
 TIME: addTimeToCurrentTime(data.TIME),
 name: new Date().toLocaleTimeString(),
 DEVICE_ID: data.DEVICE_ID,
 LATITUDE: data.LATITUDE,
 LONGITUDE: data.LONGITUDE,
 ALTITUDE: data.ALTITUDE,
 FUEL_LEVEL: parseFloat(data.FUEL_LEVEL),
 SPEED: parseFloat(data.SPEED),
 ENGINE_RPM: parseFloat(data.ENGINE_RPM),
 IGNITION:parseFloat(data.IGNITION)
 }
 ;
 allData.push(commingData)
 setLastUpdatedTimestamp(data.TIME)
 console.log(allData)
 }
 

 } catch (error) {
 console.log("Error parsing WebSocket data:", error);
 }
 };
 
 socket.onerror = (error) => {
 console.log("WebSocket error:", error);
 };
 
 socket.onclose = () => {
 console.log("WebSocket connection closed");
 };
 
 return () => {
 socket.close();
 };
 }, []);


//  function checkStatus() {
//  console.log(allData.length)
//  if(allData.length>0){
//  let allDataLength = allData.length;
//  console.log(allDataLength)
//  let lastPos = allData[allDataLength-1];
//  let lastTime = timeToSeconds(lastPos?.TIME);
//  const currentDate = new Date();
//  const currentTime = timeToSeconds(currentDate.toTimeString().slice(0,8))
//  console.log(currentTime); 
//  if(currentTime-lastTime<=30){
//     if(lastPos.ENGINE_RPM<650){
//     setStatus("Ignition On")
//     }
//     else if(lastPos.ENGINE_RPM>=650){
//     setStatus("Cranked & Halted")
//     }
//  if(allData.length>1){
//  let lastPostion = allData[allData.length-1];
//  let secondLast = allData[allData.length-2];
 
//  if((lastPostion.LATITUDE!= secondLast.LATITUDE || lastPostion.LONGITUDE!= secondLast.LONGITUDE) && currentTime-lastTime<=30 && (timeToSeconds(lastPostion.TIME)- timeToSeconds(secondLast.TIME)) <= 30){
//  setStatus("Running")
//  }
//  }
//  }
//  else{
//  setStatus("Stopped")
//  console.log("stopped2")
//  }
//  }
//  else{
//  setStatus("Stopped")
//  console.log("Stopped 1")
//  }
//  }

 function checkStatus() {
    console.log(allData.length)
    if(allData.length>0){
    let allDataLength = allData.length;
    console.log(allDataLength)
    let lastPos = allData[allDataLength-1];
    let lastTime = timeToSeconds(lastPos?.TIME);
    const currentDate = new Date();
    const currentTime = timeToSeconds(currentDate.toTimeString().slice(0,8))
    console.log(currentTime);
    console.log(lastPos) 
    if(lastPos.SPEED>0)
        setStatus("Running")
    else if(lastPos.ENGINE_RPM>650 && lastPos.IGNITION===1.000000)
        setStatus("Cranked & Halted")
    else if(lastPos.ENGINE_RPM<=650 && lastPos.IGNITION===1.000000)
        setStatus("Ignition On")
    else
    setStatus("Stopped");
    }
 }

 React.useEffect(() => {
 console.log("i m in")
 const intervalId = setInterval(checkStatus, 12000);
 return () => {
 clearInterval(intervalId);
 };
 }, []);
 


 return (
 <div className="grid grid-cols-12 gap-4 md:gap-6">
 
 <div className="col-span-12 xl:col-span-6">
 <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 md:gap-5">
 {/* Metric Item Start */}
 <Card sx={{ 
 borderRadius: 3, 
 boxShadow: 3, 
 transform: "scale(0.8)", 
 width: '80%' // Ensure the Card takes full width of its container
 }}>
 <CardContent sx={{paddingLeft:'20px'}}>
 <Box display="flex" flexDirection='column'>
 <Typography sx={{ color: "black", fontSize: "1rem" }} variant="body2" color="text.secondary">
 Tractor Number
 </Typography>
 <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: "1.2rem" }}>
 HR 51 TC 2004/45/25
 </Typography>
 </Box>
 </CardContent>
 </Card>

 {/* Status Box */}
 {
 (date === today || !date) ? (
 <Box
 sx={{
 width: '85px', // Increased width for the status box
 padding: '1px 17px',
 margin: '10px',
height:'25px',
 borderRadius: '7px',
 opacity: 0.9,
 ...getStatusStyle(status), // Assuming this is a function that dynamically adjusts styles
 }}
 >
 {status}
 </Box>
 ) : (
 <></> // This renders nothing when the condition is false
 )
 }
 </div>
 </div>


 <div className="col-span-12 xl:col-span-6">
  <div style={{ padding: "25px" }} className="grid grid-cols-1 gap-4 md:gap-6">
    <div className="flex gap-6 items-center">
      {/* Date Picker */}
      <div className="flex-1">
        <Flatpickr
          options={{
            dateFormat: "Y-m-d", // Set the date format
          }}
          placeholder="Choose a date"
          className="w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md h-14 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          onChange={handleDateChange} // Handle date change
        />
      </div>

      {/* Last Updated Timestamp Box */}
      {!lastUpdatedTimestamp && (
        <Box
          sx={{
            width: '180px',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 5,
            px: 2,
            py: 0.5,
          }}
        >
          <Typography variant="caption" color="textSecondary" >Last Updated Timestamp</Typography>
          <Typography variant="subtitle2">
            4:30:45 PM {lastUpdatedTimestamp}
          </Typography>
        </Box>
      )}
    </div>
  </div>
</div>

 

 <div className="col-span-12 mt-5">
 {(date === today || !date) ? <LiveMap tractor_id={tractor_id} /> : <PathMap tractor_id={tractor_id} date={date} />}
 </div>
 {/* Demographics & Orders */}
 {/* <div className="col-span-12 xl:col-span-6">
 <GraphData newData={newData}/>
 </div> */}
 <div className="col-span-12 xl:col-span-7">
 {/* <RecentOrders /> */}
 </div>
 </div>
 );
 }
 export default Tracking;