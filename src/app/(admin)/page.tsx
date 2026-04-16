"use client";
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Alert, Button, Typography } from '@mui/material';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import { useRouter } from 'next/navigation';
import { Box, Stack } from '@mui/system';
import axios from 'axios';
import AddTractor from '@/components/dashboard/addTractor';
import AddIcon from '@mui/icons-material/Add';

// Helper function to create data
function createData(
 id: number,
 tractor_name: string,
 device_id:string,
 tractor_number: string,
 registered: string,
 HMR:string,
 distance: string,
 distanceToday: string,
 status: string,
 view: string
) {
 return { id, tractor_name, device_id,tractor_number,registered,HMR, distance, distanceToday, status , view};
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


 interface TableData {
 date: string;
 hmr: string;
 distance:string;
 location:string;
 }

// Sample data for the table

export default function Dashboard() {
 const router = useRouter();
 const [status, setStatus] = React.useState<string>("Stopped");
 const [status1, setStatus1] = React.useState<string>("Stopped");
 const [status2, setStatus2] = React.useState<string>("Stopped");
 const [tableData, setTableData] = React.useState<TableData[]>([]);
 const [totalDistance, setTotalDistance] = React.useState<number>(0)
 const [totalHMR, setTotalHMR] = React.useState<string>('00:00:00')
 const [totalDistance1, setTotalDistance1] = React.useState<number>(0)
 const [totalHMR1, setTotalHMR1] = React.useState<string>('00:00:00')
 const [totalDistance2, setTotalDistance2] = React.useState<number>(0)
 const [totalHMR2, setTotalHMR2] = React.useState<string>('00:00:00')
 const [totalDistance3, setTotalDistance3] = React.useState<number>(0)
 const [totalDistance4, setTotalDistance4] = React.useState<number>(0)
 const [totalHMR3, setTotalHMR3] = React.useState<string>('00:00:00')
 const [totalHMR4, setTotalHMR4] = React.useState<string>('00:00:00')
 const [allData, setAllData] = React.useState<ChartData[]>([]);
 const [liveData, setLiveData] = React.useState<ChartData[]>([]);
 const [todayDistance, setTodayDistance] = React.useState<number>(0)
 const [todayDistance1, setTodayDistance1] = React.useState<number>(0)
 const [addTractorAlert, setAddTractorAlert] = React.useState(false);
 const [faidAddTractorAlert, setFaidAddTractorAlert] = React.useState(false);
 const [modal, setModal] = React.useState(false);
// const [tractorData, setTractorData] = React.useState<>([]);

 const rows = [
 createData(1, 'FT 45','EKL_06', 'HR 51 TC 2004/45/25','03/04/25',`${totalHMR}`,`${totalDistance}`, `0`, `${status}`,"yes"),
 createData(2, 'FT 6065','EKL_031', 'HR 53 TC 2004/45/311','04/08/25',`${totalHMR1}`,`${totalDistance1}`, `${todayDistance1}`, `${status1}`,"yes"),
 createData(3, 'FT 6065','EKL_03', 'Not known', '10/03/26',`${totalHMR2}`,`${totalDistance2}`, `${todayDistance}`, `${status}`,'yes'),
 createData(4, 'FT 6065','EKL_04', 'HR 51TC 2004/45/310','17/03/26',`${totalHMR3}`,`${totalDistance3}`, `${todayDistance}`, `${status}`,'yes'),
 createData(5, 'FT 6065','EKL_05', 'HR-53-TC 2004/45/330','07/04/26',`${totalHMR4}`,`${totalDistance4}`, `${todayDistance}`, `${status}`,'yes'),
 ];
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

 const secondsToTime = (seconds: number): string => {
 const hours = Math.floor(seconds / 3600);
 const minutes = Math.floor((seconds % 3600) / 60);
 const secs = seconds % 60;

 return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

 
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


 function calculateDecimal(number: number): string {
 const [integerPart, decimalPart] = number.toString().split(".")
 const result = (parseInt(decimalPart) / 60); 
 const res = result.toString().replace('.', '');
 const firstSixDigits = res.slice(0, 6);
 const afterDecimal = parseInt(firstSixDigits)
 return `${Math.floor(number)}.${afterDecimal}`;
}

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
 const R = 6371; // Radius of Earth in km
 const dLat = (lat2 - lat1) * (Math.PI / 180); // Convert degrees to radians
 const dLon = (lon2 - lon1) * (Math.PI / 180); // Convert degrees to radians

 const a =
 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
 Math.sin(dLon / 2) * Math.sin(dLon / 2);

 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

 return R * c; // Returns distance in km
};

React.useEffect(() => {
 setLiveData([])
 let HMR = 0
 const fetchDetails = async () => {
 try {
 
 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/live/EKL_03`);
 console.log(res?.data)

 if(res.status==200){
 let lastTimestamp: string | null = null; 
 console.log(lastTimestamp)

 const newData = res.data
 .filter((item: any) => {
 const latitude = item.message.LATITUDE;
 const longitude = item.message.LONGITUDE;
 
 return (
 latitude !== '0.0000' && latitude !== '0.000000' &&
 longitude !== '0.0000' && longitude !== '0.000000' &&
 latitude !== '0' && longitude !== '0' &&
 latitude !== null && longitude !== null
 );
 })
 .map((item: any) => {
 const updatedEngineRpm = item.message.ENGINE_RPM < 649 ? 0 : item.message.ENGINE_RPM;
 
 return {
 "TIME": addTimeToCurrentTime(item.message.TIME),
 "DEVICE_ID": item.message.DEVICE_ID,
 "LATITUDE": calculateDecimal(item.message.LATITUDE),
 "LONGITUDE": calculateDecimal(item.message.LONGITUDE),
 "ALTITUDE": item.message.ALTITUDE,
 "SPEED": item.message.SPEED,
 "FUEL_LEVEL": item.message.FUEL_LEVEL,
 "ENGINE_RPM": updatedEngineRpm 
 };
 })
 .filter((value: any, index: any, self: any) => {
 return index === self.findIndex((t: any) => t.TIME === value.TIME);
 });
 

 console.log(newData)
 setLiveData(newData)
 let totalDistance = 0
 let allDataLenght = newData.length
 // console.log(allDataLenght)
 let lastPostion = newData[allDataLenght-1]
 console.log(lastPostion)
 // Loop through the coordinates and calculate distance between consecutive points
 for (let i = 0; i < newData.length - 1; i++) {
 const current = newData[i];
 const next = newData[i + 1];
 
 const lat1 = parseFloat(current.LATITUDE);
 const lon1 = parseFloat(current.LONGITUDE);
 const lat2 = parseFloat(next.LATITUDE);
 const lon2 = parseFloat(next.LONGITUDE);
 if(next.TIME != "Error: Invalid time format" && current.TIME != "Error: Invalid time format"){
 // const dif = timeToSeconds(next.TIME) - timeToSeconds(current.TIME)
 // if(lat1 != lat2 || lon1 != lon2){
 // if(dif<=1200 && dif >= -1200){
 // HMR += dif
 // }
 // }
 // }
 totalDistance += haversine(lat1, lon1, lat2, lon2);

 
 }
 // console.log(secondsToTime(HMR))
 // setHMR(secondsToTime(HMR))
 setTodayDistance( parseFloat(totalDistance.toFixed(2)))
 }
 }
 else{
 console.log("failed to load data")
 }

 } catch (err) {
 console.log(err)
 } 
 };

 fetchDetails(); 
}, []);


 React.useEffect(() => {
 const fetchDetails = async () => {
 try {
 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/EKL_06`);
 console.log(res)
 console.log(res.data.resp)
 const totalDistance = res.data.resp.reduce((sum: number, item: any) => {
 if (item.distance != null) {
 console.log(item.distance);
 console.log(sum);
 return sum + parseFloat(item.distance);
 }
 return sum;
}, 0);

const totalHMR = res.data.resp.reduce((sum: number, item: any) => {
 if (item.hmr != null) {
 console.log(item.hmr);
 console.log(sum);
 return sum + timeToSeconds(item.hmr);
 }
 return sum;
}, 0);

 console.log(totalDistance)
 setTableData(res.data.resp)
 setTotalDistance(totalDistance.toFixed(2))
 setTotalHMR(secondsToTime(totalHMR))
 }
 catch(err){
 console.log(err)
 }
 }

 const fetchDetails1 = async () => {
    try {
    const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/EKL_031`);
    console.log(res)
    console.log(res.data.resp)
    const totalDistance = res.data.resp.reduce((sum: number, item: any) => {
    if (item.distance != null) {
    console.log(item.distance);
    console.log(sum);
    return sum + parseFloat(item.distance);
    }
    return sum;
   }, 0);
   
   const totalHMR = res.data.resp.reduce((sum: number, item: any) => {
    if (item.hmr != null) {
    console.log(item.hmr);
    console.log(sum);
    return sum + timeToSeconds(item.hmr);
    }
    return sum;
   }, 0);
   
    console.log(totalDistance)
    setTableData(res.data.resp)
    setTotalDistance1(totalDistance.toFixed(2))
    setTotalHMR1(secondsToTime(totalHMR))
    }
    catch(err){
    console.log(err)
    }
    }
 const fetchDetails2 = async () => {
    try {
    const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/EKL_03`);
    console.log(res)
    console.log(res.data.resp)
    const totalDistance = res.data.resp.reduce((sum: number, item: any) => {
    if (item.distance != null) {
    console.log(item.distance);
    console.log(sum);
    return sum + parseFloat(item.distance);
    }
    return sum;
   }, 0);
   
   const totalHMR = res.data.resp.reduce((sum: number, item: any) => {
    if (item.hmr != null) {
    console.log(item.hmr);
    console.log(sum);
    return sum + timeToSeconds(item.hmr);
    }
    return sum;
   }, 0);
   
    console.log(totalDistance)
    setTableData(res.data.resp)
    setTotalDistance2(totalDistance.toFixed(2))
    setTotalHMR2(secondsToTime(totalHMR))
    }
    catch(err){
    console.log(err)
    }
    }
     const fetchDetails3 = async () => {
    try {
    const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/EKL_04`);
    console.log(res)
    console.log(res.data.resp)
    const totalDistance = res.data.resp.reduce((sum: number, item: any) => {
    if (item.distance != null) {
    console.log(item.distance);
    console.log(sum);
    return sum + parseFloat(item.distance);
    }
    return sum;
   }, 0);
   
   const totalHMR = res.data.resp.reduce((sum: number, item: any) => {
    if (item.hmr != null) {
    console.log(item.hmr);
    console.log(sum);
    return sum + timeToSeconds(item.hmr);
    }
    return sum;
   }, 0);
   
    console.log(totalDistance)
    setTableData(res.data.resp)
    setTotalDistance3(totalDistance.toFixed(2))
    setTotalHMR3(secondsToTime(totalHMR))
    }
    catch(err){
    console.log(err)
    }
    }
      const fetchDetails4 = async () => {
    try {
    const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/EKL_05`);
    console.log(res)
    console.log(res.data.resp)
    const totalDistance = res.data.resp.reduce((sum: number, item: any) => {
    if (item.distance != null) {
    console.log(item.distance);
    console.log(sum);
    return sum + parseFloat(item.distance);
    }
    return sum;
   }, 0);
   
   const totalHMR = res.data.resp.reduce((sum: number, item: any) => {
    if (item.hmr != null) {
    console.log(item.hmr);
    console.log(sum);
    return sum + timeToSeconds(item.hmr);
    }
    return sum;
   }, 0);
   
    console.log(totalDistance)
    setTableData(res.data.resp)
    setTotalDistance4(totalDistance.toFixed(2))
    setTotalHMR4(secondsToTime(totalHMR))
    }
    catch(err){
    console.log(err)
    }
    }
 fetchDetails2();
 fetchDetails1();
 fetchDetails(); 
 fetchDetails3();
 fetchDetails4();
 }, []);

 React.useEffect(() => {
 const fetchAllTractor = async () => {
 try {
 const res = await axios.get("https://fdcserver.escortskubota.com/fdc/tractor/all");
 const tractors = res?.data?.data;
console.log("320",tractors);
 const tractorsWithDistance = await Promise?.all(
 tractors?.map(async (tractor:any) => {
 const id = tractor?.TractorId;
 let totalDistance = 0;

 const response = await axios.get(`https://fdcserver.escortskubota.com/fdc/tractor/trip/${id}`);
 const trips = response?.data?.data || [];

 trips.forEach((trip:any) => {
 totalDistance += parseFloat(trip?.distance || 0);
 });

 return {
 ...tractor,
 totalDistance,
 };
 })
 );
 // setTractorData(tractorsWithDistance);
 console.log(tractorsWithDistance);
 console.log("Final Tractor Data with Distances:", tractorsWithDistance);
 } catch (err) {
 console.error("Error fetching data:", err);
 }
 };

 fetchAllTractor();
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
//  if(lastPos.ENGINE_RPM<650){
//  setStatus("Ignition On")
//  }
//  else if(lastPos.ENGINE_RPM>=650){
//  setStatus("Cranked & Halted")
//  }
//  if(allData.length>1){
//  let lastPostion = allData[allData.length-1];
//  let secondLast = allData[allData.length-2];
 
//  if((lastPostion.LATITUDE!= secondLast.LATITUDE || lastPostion.LONGITUDE!= secondLast.LONGITUDE) && currentTime-lastTime<=30 && (timeToSeconds(lastPostion.TIME)- timeToSeconds(secondLast.TIME)) <= 30){
//  setStatus("Running")
//  }
//  }
// }
//  else{
//  setStatus("Stopped")
//  console.log("stopped")
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
 const intervalId = setInterval(checkStatus, 30000);
 return () => {
 clearInterval(intervalId);
 };
 }, []);




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

 const handleAddTractor= ()=>{
 setModal(true);
}
 return (
<>
<div style={{ display: 'flex', justifyContent: 'flex-end', marginRight:"24px" }}>
 <Stack direction="row" spacing={2}>
 <Button variant="contained" onClick={handleAddTractor} startIcon={<AddIcon />}>
 Add Tractor
 </Button>
 {modal && <AddTractor setModal={setModal} setAddTractorAlert={setAddTractorAlert} setFaidAddTractorAlert={setFaidAddTractorAlert}/>}
 </Stack>
 </div>

<Box sx={{ p: 3 }}>
 <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
 <Table sx={{ minWidth: 650 }} aria-label="tractor data table">
 <TableHead>
 <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
 <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Tractor Name
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Tractor Number
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 CRDi / non-CRDi
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Testing Initiated On
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 HMR (HH:MM:SS)
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Distance Travelled
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Distance Travelled Today
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Status
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>View</TableCell>
 </TableRow>
 </TableHead>

 <TableBody>
 {rows.map((row) => (
 <TableRow
 key={row.id}
 sx={{
 '&:last-child td, &:last-child th': { border: 0 },
 backgroundColor: row.id % 2 === 0 ? '#fafafa' : 'white', // Alternate row colors
 '&:hover': { backgroundColor: '#f1f1f1' }, // Hover effect
 }}
 >
 <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
 {row.id}
 </TableCell>
 <TableCell align="right">{row.tractor_name}</TableCell>
 <TableCell align="right">{row.tractor_number}</TableCell>
 {row.tractor_number=='HR 53 TC 2004/45/311' ?<TableCell align="right">CRDi</TableCell>:<></>}
 {row.tractor_number=='HR 51 TC 2004/45/25'?<TableCell align="right">CRDi</TableCell>:<></>}
 {row.tractor_number=='Not known'?<TableCell align="right">CRDi</TableCell>:<></>}
 {row.tractor_number=="HR 51TC 2004/45/310"?<TableCell align="right">CRDi</TableCell>:<></>}
 {row.tractor_number=="HR-53-TC 2004/45/330"?<TableCell align="right">CRDi</TableCell>:<></>}


 <TableCell align="right">{row.registered}</TableCell>
 <TableCell align="right">{row.HMR}</TableCell>

 <TableCell align="right">{row.distance} km</TableCell>
 <TableCell align="right">{row.distanceToday} km</TableCell>
 <TableCell align="right">
 <Box
 sx={{
 display: 'inline-block',
 padding: '4px 12px',
 borderRadius: '12px',
 opacity: 0.9,
 ...getStatusStyle(row.status), // Apply dynamic styles
 }}
 >
 {row.status}
 </Box>
 </TableCell>
 <TableCell align="right">
 {row.view==="yes"?<Button
 onClick={() => {
 router.push(`/tracking/${row.device_id}/${encodeURIComponent(row.tractor_number)}`); 
 }}
 variant="contained"
 color="primary"
 startIcon={<ViewIcon />}
 sx={{
 padding: '6px 16px',
 borderRadius: '4px',
 '&:hover': {
 backgroundColor: '#1565c0',
 },
 }}
 >
 View
 </Button>:<></>}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Box>
 {addTractorAlert&&<Alert color='success'>Tractor Added Successfully</Alert>}
 {faidAddTractorAlert&&<Alert color='error'>Failed to Add Tractor</Alert>}
</>
 );
}
