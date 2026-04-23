"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
import speedImage from "../../../public/images/icons8-speed-24.png"
import L, { LatLngExpression, LatLngTuple } from 'leaflet';
import "leaflet/dist/leaflet.css";
import {
LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush, AreaChart, Area, ResponsiveContainer,
ComposedChart,
Legend
} from 'recharts';
import axios from "axios";
import { Backdrop, Box, Button, Card, CardContent, Chip, Divider, Fade, Grid, Modal, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import SpeedIcon from '@mui/icons-material/Speed';
import StraightenIcon from '@mui/icons-material/Straighten';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import OpacityIcon from '@mui/icons-material/Opacity';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import dayjs from 'dayjs';

interface WebSocketData {
DEVICE_ID: string;
TIME: string;
FUEL_LEVEL: string;
SPEED: string;
ENGINE_RPM: string;
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
BATTERY_VOLTAGE:number;
ENG_TEMP:number;
P2264_13:string;
P0193_12:string;
P0251_13:string;
P0183_00:string;
FUEL_TEMP:number;
COOLANT_TEMP:number;
}

interface TableData {
 date: string;
 hmr: string;
 distance:string;
 location:string;
 }

interface _Data {
TIME: string;
DEVICE_ID: string;
LATITUDE:string;
LONGITUDE:string
FUEL_LEVEL: string;
SPEED: string;
ENGINE_RPM: string;
BATTERY_VOLTAGE:number;
ENG_TEMP:string;
P2264_13:string;
P0193_12:string;
P0251_13:string;
P0183_00:string;
FUEL_TEMP:number;
COOLANT_TEMP:number;
}

interface GraphDataProps {
newData: _Data | null; // Assuming it expects a `data` prop
}

interface AssetTrackerMessage {
 TIME: string;
 DEVICE_ID: string;
 LATITUDE: string;
 LONGITUDE: string;
 ALTITUDE: string;
 SPEED: string;
 FUEL_LEVEL: string;
 ENGINE_RPM: string;
 BATTERY_VOLTAGE:number;
 P2264_13:string;
 P0193_12:string;
 P0251_13:string;
 P0183_00:string;
FUEL_TEMP:number;
COOLANT_TEMP:number;
 }

 interface live_tractor_prop{
    tractor_id:string;
 }
 
 interface AssetTrackerData {
 timestamp: string;
 topic: string;
 message: AssetTrackerMessage;
 }

 const demo = [
 {
 name: 'Page A',
 uv: 590,
 amt: 1400,
 },
 {
 name: 'Page B',
 uv: 868,
 amt: 1506,
 },
 {
 name: 'Page C',
 uv: 1397,
 amt: 989,
 },
 {
 name: 'Page D',
 uv: 1480,
 amt: 1228,
 },
 {
 name: 'Page E',
 uv: 1520,
 
 amt: 1100,
 },
 {
 name: 'Page F',
 uv: 1400,
 
 amt: 1700,
 },
 ];



const customIcon = L.icon({
iconUrl: '/images/loaction.png', // put your image path here
 iconSize: [6, 6],   // small but hoverable
  iconAnchor: [3, 3],
popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
});
interface DTCData {
  code: string;
  status: '1.000000' | '2.000000' | '0.000000' | '-1';
  description:string;
}

interface DtcItem {
  code: string;
  description: string;
  status: 'active' | 'warning' | 'ok' | string;
  details?: string; // optional additional details
}

// Props for the component
interface DtcModalProps {
  dtcData: DtcItem[];
}

// Function to get the color for each status
// const getStatusColor = (status: '1.000000' | '2.000000' | '0.000000'| '-1'): string => {
//   switch (status) {
//     case '1.000000':
//       return '#D3D3D3';
//     case '2.000000':
//       return '#D3D3D3';
//     case '0.000000':
//       return '#f24646';
//     default:
//       return '#f5f5f5';
//   }
// };

// const convertStatusToMessage=(status: '1.000000' | '2.000000' | '0.000000'| '-1'): string=>{
//   switch (status) {
//     case '1.000000':
//       return 'OK';
//     case '2.000000':
//       return 'OK';
//     case '0.000000':
//       return 'Faulty';
//     default:
//       return 'No Status';
//   }
// }

// Dynamic import for SSR fix
const Map = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayerComp = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const MarkerComp = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const PopupComp = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const PolylineComp = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });


interface UpdateMapViewProps {
 position: LatLngExpression | undefined;
}
// Custom component to move the map when new data arrives
const UpdateMapView = ({position}:UpdateMapViewProps) => {
 if (typeof window !== 'undefined' && position) {
const map = useMap();
useEffect(() => {
if (position) {
map?.setView(position, 15);
}
}, [position, map]);
return null;
 }
};

const LiveMap:React.FC<live_tractor_prop> = ({tractor_id}) => {
const [positions, setPositions] = useState<LatLngTuple[]>([]); // Default: Nashik
const [center, setCenter] = useState<LatLngExpression>(); 
const [Data, setData] = useState<ChartData[]>([]);
const [brushIndices, setBrushIndices] = useState<{ startIndex: number, endIndex: number }>({ startIndex: 0, endIndex: 20 });
const [disPositions, setDisPositions] = useState<number[][]>([]);
const [totalDistance, setTotalDistance] = useState<number>(0);
const [location, setLocation] = useState<string[]>(["NA"]); 
const [time, setTime] = useState<string>(); 
const [speed, setSpeed] = useState<number>(0); 
const [lat, setLat] = useState<number>(0);
const [long, setLong] = useState<number>(0);
const [engTemp, setEngTemp] = useState<number>(0);
const [fuelTemp, setFuelTemp] = useState<number>(0);
const [coolantTemp, setCoolantTemp] = useState<number>(0);
const [batteryVoltage, setBatteryVoltage] = useState<number>(0);
const [activeDTCs, setActiveDTCs] = useState<number>(0);
const [healedDTCs, setHealedDTCs] = useState<number>(0);
 const [newHMR, setNewHMR] = useState<string>("00:00:00"); 
const [dtcData,setDtcData] = useState<DTCData[]>([
  { code: 'P0183-00', status: "-1", description:'Water in Fuel'},
  { code: 'P0193-12', status: "-1", description:'Metering Unit'},
  { code: 'P0251-13', status: "-1", description:'Rail Pressure'},
  { code: 'P2264-13', status: "-1", description:'Fuel Temp'},
]);
const [HMR, setHMR] = useState<string>("00:00:00"); 
const [status, setStatus] = useState<string>("Stopped");
const [tableData, setTableData] = useState<TableData[]>([]);

const latRef = useRef(lat);
const longRef = useRef(long);
const [open, setOpen] = useState<boolean>(false);
const [selectedDtc, setSelectedDtc] = useState<string>('');
const [pointTime, setPointTime] = useState<string[]>([]); 

const handleOpen = (dtc: string) => {
  console.log(dtc)
  setSelectedDtc(dtc);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setSelectedDtc('');
};

 const start = tractor_id==='EKL_06'?dayjs('2025-04-04'):dayjs('2025-08-04');
 const yesterday = dayjs().subtract(1, 'day');

 // Generate array of all dates from start to yesterday inclusive
 const allDates: string[] = [];
 for (let d = start; d.isBefore(yesterday) || d.isSame(yesterday, 'day'); d = d.add(1, 'day')) {
 allDates.push(d.format('YYYY-MM-DD'));
 }


// Update latRef and longRef on state change
useEffect(() => {
 latRef.current = lat;
 longRef.current = long;
}, [lat, long]);

// Handle Brush changes with optional startIndex and endIndex
const handleBrushChange = (newIndex: { startIndex?: number; endIndex?: number }) => {
setBrushIndices({
startIndex: newIndex.startIndex ?? 0, // Use fallback if undefined
endIndex: newIndex.endIndex ?? 20, // Use fallback if undefined
});
};


function addTimeToCurrentTime(currentTime:string) {
 const additionalTime = "00:00"
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

function calculateDecimal(number: number): string {
 const [integerPart, decimalPart] = number.toString().split(".")
 const result = (parseInt(decimalPart) / 60); 
 const res = result.toString().replace('.', '');
 const firstSixDigits = res.slice(0, 6);
 const afterDecimal = parseInt(firstSixDigits)
 return `${Math.floor(number)}.${afterDecimal}`;
}

const timeToSeconds = (time: string): number => {
  const timePart = time.split(",")[1];
  const cleanTime = timePart.split("+")[0];
  const [hours, minutes, seconds] = cleanTime.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const secondsToTime = (seconds: number): string => {
 const hours = Math.floor(seconds / 3600);
 const minutes = Math.floor((seconds % 3600) / 60);
 const secs = seconds % 60;

 return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};


useEffect(() => {
 setData([])
 let HMR = 0
 const fetchDetails = async () => {
 try {

 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/live/${tractor_id}`);
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
 TIME: item.message.TIME,
 DEVICE_ID: item.message.DEVICE_ID,
 LATITUDE: calculateDecimal(item.message.LATITUDE),
 LONGITUDE: calculateDecimal(item.message.LONGITUDE),
 ALTITUDE: item.message.ALTITUDE,
 SPEED: item.message.SPEED,
 FUEL_LEVEL: item.message.FUEL_LEVEL,
 ENGINE_RPM: updatedEngineRpm,
 BATTERY_VOLTAGE:item.message.BATTERY_VOLTAGE,
 ENG_TEMP:item.message.ENG_TEMP,
 COOLANT_TEMP:item.message.COOLANT_TEMP,
 FUEL_TEMP:item.message.FUEL_TEMP,
 P2264_13:item.message["P2264-13"],
 P0251_13:item.message["P0251-13"],
 P0193_12:item.message["P0193-12"],
 P0183_00:item.message["P0183-00"],
 };
 })
 .filter((value: any, index: any, self: any) => {
 return index === self.findIndex((t: any) => t.TIME === value.TIME);
 });

const dataHMR = res.data.map((item: any) => {
 const updatedEngineRpm = item.message.ENGINE_RPM < 100 ? 0 : item.message.ENGINE_RPM;
 
 return {
 TIME: item.message.TIME,
 DEVICE_ID: item.message.DEVICE_ID,
 LATITUDE: calculateDecimal(item.message.LATITUDE),
 LONGITUDE: calculateDecimal(item.message.LONGITUDE),
 ALTITUDE: item.message.ALTITUDE,
 SPEED: item.message.SPEED,
 FUEL_LEVEL: item.message.FUEL_LEVEL,
 ENGINE_RPM: updatedEngineRpm,
 BATTERY_VOLTAGE:item.message.BATTERY_VOLTAGE,
 ENG_TEMP:item.message.ENG_TEMP,
 COOLANT_TEMP:item.message.COOLANT_TEMP,
 FUEL_TEMP:item.message.FUEL_TEMP,
 P2264_13:item.message["P2264-13"],
 P0251_13:item.message["P0251-13"],
 P0193_12:item.message["P0193-12"],
 P0183_00:item.message["P0183-00"],
 };
 })
 .filter((value: any, index: any, self: any) => {
 return index === self.findIndex((t: any) => t.TIME === value.TIME);
 });

 let newHMR = 0
let counter = 0
for (let i = 0; i < dataHMR.length - 1; i++) {
 const current = dataHMR[i];
 const next = dataHMR[i + 1];
 if(next.TIME != "Error: Invalid time format" && current.TIME != "Error: Invalid time format"){
   if(next.ENGINE_RPM > 0 && current.ENGINE_RPM > 0){
    console.log("current time",current.TIME,"next time",next.TIME)
    const dif = timeToSeconds(next.TIME) - timeToSeconds(current.TIME)
    console.log("time difference",dif)
     if(dif<=600 && dif>0){
       newHMR += dif
      }
  }
 }

 }

  console.log("new hmr",secondsToTime(newHMR))
 

 console.log(newData)
 setData(newData)
 let totalDistance = 0
 let allDataLenght = newData.length
 // console.log(allDataLenght)
 let lastPostion = newData[allDataLenght-1]
 console.log(lastPostion)
 setTime(lastPostion.TIME)
 const latitude = parseFloat(lastPostion?.LATITUDE); 
 const longitude = parseFloat(lastPostion?.LONGITUDE);
 let healed =0;
 let active=0;
 setLat(latitude) 
 setLong(longitude)
 const location = await getLocationFromCoordinates(latitude, longitude);
 const locationArray = location.split(", ")
 setLocation(locationArray)
 setEngTemp(parseFloat(lastPostion.ENG_TEMP));
 setCoolantTemp(parseFloat(lastPostion.COOLANT_TEMP));
 setFuelTemp(parseFloat(lastPostion.FUEL_TEMP));
 setBatteryVoltage(parseFloat(lastPostion.BATTERY_VOLTAGE));
 setDtcData(()=>{
  return [
      { code: 'P0183-00', status: lastPostion?.["P0183_00"], description:'Fuel Temp'},
      { code: 'P0193-12', status: lastPostion?.["P0193_12"], description:'Rail Pressure'},
      { code: 'P0251-13', status: lastPostion?.["P0251_13"], description:'Metering Unit'},
      { code: 'P2264-13', status: lastPostion?.["P2264_13"], description:'Water in Fuel'},
    ];
 })
 if(lastPostion["P0183_00"]==='0.000000')
  active++;
else if(lastPostion["P0183_00"]==='1.000000')
  healed++;

if(lastPostion["P0193_12"]==='0.000000')
  active++;
else if(lastPostion["P0193_12"]==='1.000000')
  healed++;

if(lastPostion["P0251_13"]==='0.000000')
  active++;
else if(lastPostion["P0251_13"]==='1.000000')
  healed++;

if(lastPostion["P2264_13"]==='0.000000')
  active++;
else if(lastPostion["P2264_13"]==='1.000000')
  healed++;

setActiveDTCs(active)
setHealedDTCs(healed)
 // Loop through the coordinates and calculate distance between consecutive points
 for (let i = 0; i < newData.length - 1; i++) {
 const current = newData[i];
 const next = newData[i + 1];
 const lat1 = parseFloat(current.LATITUDE);
 const lon1 = parseFloat(current.LONGITUDE);
 const lat2 = parseFloat(next.LATITUDE);
 const lon2 = parseFloat(next.LONGITUDE);
 if(next.TIME != "Error: Invalid time format" && current.TIME != "Error: Invalid time format"){
 const dif = timeToSeconds(next.TIME) - timeToSeconds(current.TIME)
 if(lat1 != lat2 || lon1 != lon2){
 if(dif<=1200 && dif > 0 ){
 HMR += dif
 }
 }
 }
 totalDistance += haversine(lat1, lon1, lat2, lon2);

 
 }
 console.log(secondsToTime(HMR))
 setHMR(secondsToTime(HMR))
 setTotalDistance(totalDistance)

 if (newData?.length > 0) {
 console.log(newData)
 const positions:LatLngTuple[] = newData.map((point:any) => [parseFloat(point.LATITUDE), parseFloat(point.LONGITUDE)]);
 console.log(positions)
 setPositions(positions)
 const time = newData.map((point:any) => point.TIME);
 setPointTime(time)
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

 useEffect(() => {
 const fetchDetails = async () => {
 try {
 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/${tractor_id}`);
 console.log(res.data.resp)
 setTableData(res.data.resp)
 }
 catch(err){
 console.log(err)
 }
 }

 fetchDetails(); 
 }, []);


 let allData : ChartData[] = []
useEffect(() => {
  console.log("in")
const socket = new WebSocket("wss://fdcserver.escortskubota.com/ws/"); // Change to your WebSocket server
socket.onopen = () => {
  console.log("in1")
console.log("Connected to WebSocket");
};

socket.onmessage = (event) => {
try {
 console.log("Event data",event?.data)
 console.log(tractor_id,typeof tractor_id);
 const data = JSON.parse(event?.data);
 console.log(data);
 console.log(data?.DEVICE_ID,typeof data?.DEVICE_ID);
 if(Data.length == 0 || Data[Data.length-1].TIME != data.TIME)
 if (data &&
   data.DEVICE_ID==`${tractor_id} `&& 
   data.DEVICE_ID && 
   data.LATITUDE!=="0.0000"&&
   data.LONGITUDE!=="0.0000" &&
   data.LATITUDE!=="0.000000"&&
   data.LONGITUDE!=="0.000000" &&
 !isNaN(parseFloat(data.ENGINE_RPM)) &&
 !isNaN(parseFloat(data.FUEL_LEVEL)) &&
 !isNaN(parseFloat(data.SPEED))&&
 !isNaN(parseFloat(data.BATTERY_VOLTAGE))&&
 !isNaN(parseFloat(data.ENG_TEMP))&&
 !isNaN(parseFloat(data.FUEL_TEMP))&&
 !isNaN(parseFloat(data.COOLANT_TEMP))&&
 !isNaN(parseFloat(data["P2264-13"]))&&
 !isNaN(parseFloat(data["P0251-13"]))&&
 !isNaN(parseFloat(data["P0193-12"]))&&
 !isNaN(parseFloat(data["P0183-00"]))) {
 console.log("i am innnnn")
 setData((prevData) => {
 const updatedData = [
 ...prevData,
 {
 TIME: data.TIME,
 name: new Date().toLocaleTimeString(),
 DEVICE_ID: data.DEVICE_ID,
 LATITUDE: calculateDecimal(data.LATITUDE),
 LONGITUDE: calculateDecimal(data.LONGITUDE),
 ALTITUDE: data.ALTITUDE,
 FUEL_LEVEL: parseFloat(data.FUEL_LEVEL),
 SPEED: parseFloat(data.SPEED),
 ENGINE_RPM: parseFloat(data.ENGINE_RPM) < 649 ? 0 : parseFloat(data.ENGINE_RPM),
 BATTERY_VOLTAGE:parseFloat(data.BATTERY_VOLTAGE),
 ENG_TEMP:parseFloat(data.ENG_TEMP),
 FUEL_TEMP:parseFloat(data.FUEL_TEMP),
 COOLANT_TEMP:parseFloat(data.COOLANT_TEMP),
 P2264_13:data["P2264-13"],
 P0251_13:data["P0251-13"],
 P0193_12:data["P0193-12"],
 P0183_00:data["P0183-00"],
 },
 ];

 allData.push(...updatedData)
 setLat(parseFloat(calculateDecimal(data.LATITUDE)))
 setLong(parseFloat(calculateDecimal(data.LONGITUDE)))
 setEngTemp(parseFloat(data.ENG_TEMP));
 setCoolantTemp(parseFloat(data.COOLANT_TEMP));
 setFuelTemp(parseFloat(data.FUEL_TEMP));
 setBatteryVoltage(parseFloat(data.BATTERY_VOLTAGE));
 setDtcData(()=>{
  return [
    { code: 'P0183-00', status: data["P0183_00"], description:'Fuel Temp'},
    { code: 'P0193-12', status: data["P0193_12"], description:'Rail Pressure'},
    { code: 'P0251-13', status: data["P0251_13"], description:'Metering Unit'},
    { code: 'P2264-13', status: data["P2264_13"], description:'Water in Fuel'},
  ];
 })
 console.log(data.SPEED)
 console.log(typeof data.SPEED)
 setSpeed(parseFloat(data.SPEED))
 return updatedData;
 }); 
 }
console.log(data);


if (data.LATITUDE && data.LONGITUDE && data.LATITUDE!=="0.000000"&& data.LONGITUDE!=="0.000000" && data.LATITUDE!=="0.0000" && data.LONGITUDE!=="0.0000") {
console.log("New Position:", data.LATITUDE, data.LONGITUDE);

setDisPositions((prevPositions) => {
 if (prevPositions.length > 0) {
 const lastPos = prevPositions[prevPositions.length - 1];
 const distance = haversine(lastPos[0], lastPos[1], parseInt(calculateDecimal(data.LATITUDE)), parseInt(calculateDecimal(data.LONGITUDE)));
 setTotalDistance((prevDistance) => prevDistance + distance);
 }

 return [...prevPositions, [parseInt(calculateDecimal(data.LATITUDE)), parseInt(calculateDecimal(data.LONGITUDE))]]; // Add new position to the list
 });

// Append new position to the list without refreshing the map
setPositions((prevPositions) => [
 ...prevPositions,
 [parseFloat(calculateDecimal(data.LATITUDE)), parseFloat(calculateDecimal(data.LONGITUDE))]
 ]);
 setCenter([parseFloat(calculateDecimal(data.LATITUDE)), parseFloat(calculateDecimal(data.LONGITUDE))])
}

setPointTime((prevTimes:string[]) => [...(prevTimes || []), data.TIME]);
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
interface TelemetryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
}
const TelemetryCard: React.FC<TelemetryCardProps> = ({ icon, label, value, unit }) => {
  return (
    <Card
      sx={{
        minWidth: 130,
        flex: '1 1 130px',
        margin: 1,
        display: 'flex',
        alignItems: 'center',
        padding: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header: Label and Icon */}
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="textSecondary">
            {label}
          </Typography>
          <Typography sx={{ color: '#1976d2', fontSize: 7 }}>
            {icon}
          </Typography>
        </Box>

        {/* Value and Unit */}
        <Typography variant="h6" sx={{ marginTop: 1 }}>
          {value} {unit}
        </Typography>
      </Box>
    </Card>
  );
};


useEffect(()=>{
 try{
 if(Data){
 let distance = totalDistance
 let newHMR = timeToSeconds(HMR)
 let allDataLenght = Data.length
 let last = Data[allDataLenght-1]
 let secondLast = Data[allDataLenght-2]
 
 const lat1 = parseFloat(last?.LATITUDE);
 const lon1 = parseFloat(last?.LONGITUDE);
 const lat2 = parseFloat(secondLast?.LATITUDE);
 const lon2 = parseFloat(secondLast?.LONGITUDE);
 if(last?.TIME != "Error: Invalid time format" && secondLast?.TIME != "Error: Invalid time format"){
 const dif = timeToSeconds(last?.TIME) - timeToSeconds(secondLast?.TIME)
 if(lat1 != lat2 || lon1 != lon2){
 if(dif<=1200 && dif > 0 ){
 newHMR += dif
 }
 }
 distance += haversine(lat1, lon1, lat2, lon2);
 setTotalDistance(distance)
 setNewHMR(secondsToTime(newHMR))
 }
 }
 
 }
 catch(err){
 console.log(err)
 }
},[Data])

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

if (typeof window === 'undefined') {
 return null; // Prevent rendering on the server-side
}

const fetchLocation = async () => {
 console.log("hi",lat,long)
 if (lat !== 0 && long !== 0) {
 const location = await getLocationFromCoordinates(lat, long);
 const locationArray = location.split(","); 
 setLocation(locationArray);
 }
 };

 async function getLocationFromCoordinates(lat: number, lng: number): Promise<string> {
 const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
 try {
 const response = await fetch(url);
 if (!response.ok) {
 throw new Error(`Error with the request: ${response.statusText}`);
 }
 const data: { display_name: string } = await response.json();
 return data?.display_name || "Location not found";
 } catch (error) {
 console.log(error);
 return "Error fetching location";
 }
 }

 useEffect(() => {
 const intervalId = setInterval(fetchLocation, 10000);
 return () => {
 clearInterval(intervalId);
 };
 }, [lat, long]);
// Get the latest position for centering the map
const latestPosition:LatLngTuple = positions.length > 0 ? positions[0] : [19.9975, 73.7898];

return (
<div>

 
<div style={{ display: 'flex', flexWrap:'wrap', width: '100%' }}>


{/* Left side: Stats Section */}
<div style={{
 flex: 1, // Keep flex as is
 display: 'flex',
 flexDirection: 'column',
 marginRight: '16.8px' // 5% increase of 16px
}}>


<Box sx={{ padding: 1 }}>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          marginTop: 0,
        }}
      >
        <TelemetryCard icon={<SpeedIcon />} label="Speed" value={speed.toFixed(2)} unit="km/h" />
        <TelemetryCard icon={<StraightenIcon />} label="Distance" value={totalDistance.toFixed(2)} unit="km" />
        <TelemetryCard icon={<AccessAlarmIcon />} label="HMR" value={newHMR} />
        <TelemetryCard icon={<LocationOnIcon />} label="Location" value={location[0]} />
        <TelemetryCard icon={<WhatshotIcon />} label="Engine Temp" value={engTemp.toFixed(2)} unit="°C" />
        <TelemetryCard icon={<OpacityIcon />} label="Fuel Temp" value={fuelTemp.toFixed(2)} unit="°C" />
        <TelemetryCard icon={<DeviceThermostatIcon />} label="Coolant Temp" value={coolantTemp.toFixed(2)} unit="°C" />
        <TelemetryCard icon={<BatteryFullIcon />} label="Battery Voltage" value={batteryVoltage.toFixed(2)} unit="V" />
      </Box>
    </Box>

<Map center={positions[0]} zoom={20} style={{ borderRadius:'10px', marginLeft:'15px', height: "500px", width: "95%", marginTop:"20px" }}>
<TileLayer
 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
 url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
 />
<UpdateMapView position={latestPosition} />

{/* Render all markers */}
{positions.map((pos, index) => {
  const isLast = index === positions.length - 1;

  const icon = isLast 
    ? L.icon({
        iconUrl: '/images/tractor.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      })
    : customIcon;

  return (
   <MarkerComp
      key={index}
      position={pos}
      icon={icon} // keep your existing icon
      eventHandlers={{
        mouseover: (e) => {
          e.target.openPopup();   // 👈 open popup on hover
        },
        mouseout: (e) => {
          e.target.closePopup();  // 👈 close popup on leave
        },
      }}
    >
      <PopupComp>
        Point {index + 1}: {pos[0]}, {pos[1]} <br />
        Time: {pointTime[index] || "N/A"}
      </PopupComp>
    </MarkerComp>
  );
})}

 {/* Draw a polyline connecting the points */}
 {positions.length > 1 && (
 <PolylineComp positions={positions} color="blue" weight={3} />
 )}
</Map>
</div>

{/* Right side: Map and Charts Section */}
<div style={{
flex: 1, // Take up 50% of the width
display: 'flex',
flexDirection: 'column'
}}>
 <Box sx={{ textAlign: 'center' }}>
      {/* DTC cards */}
      <Box sx={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around'}}>
          <Card
            sx={{
              width: '130px',
              margin: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '10px',
              backgroundColor: '#F5CD1D',
              cursor: 'pointer', // indicate clickable
              '&:hover': { boxShadow: 6 }, // hover effect
            }}
            onClick={() => handleOpen('0.000000')}
            variant="outlined"
          >
            <CardContent>
              <Typography sx={{fontWeight:'700'}} variant="subtitle2">Active DTCs</Typography>
              <Typography variant="h4">{activeDTCs}</Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              width: '130px',
              margin: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '10px',
              backgroundColor: '#1DF561',
              cursor: 'pointer', // indicate clickable
              '&:hover': { boxShadow: 6 }, // hover effect
            }}
            onClick={() => handleOpen('1.000000')}
            variant="outlined"
          >
            <CardContent>
              <Typography sx={{fontWeight:'700'}} variant="subtitle2">Healed DTCs</Typography>
              <Typography variant="h4">{healedDTCs}</Typography>
            </CardContent>
          </Card>
      </Box>

      {/* Modal Overlay */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '80%', sm: 400 },
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
            }}
          >
            { selectedDtc && dtcData&& (
              <>
                {dtcData.filter((e)=>e.status==selectedDtc).map((dtc)=> (
                  <>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      padding: 2,
                      borderRadius: 2,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow for card effect
                      backgroundColor: '#fff',
                      maxWidth: 600,
                      margin: '20px auto',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: '1rem',
                        color: '#333',
                      }}
                    >
                      DTC Code: {dtc.code}
                    </Typography>
                
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 0.5,
                        fontSize: '0.875rem',
                        color: '#555',
                      }}
                    >
                      Description: {dtc.description}
                    </Typography>
                  </Box>
                </>
              ))}
                <Button sx={{ ml:'40%',mt: 2 }} variant="contained" color="primary" onClick={handleClose}>
                  Close
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
<div style={{paddingLeft:'30px', width: '100%' }}>
<h2 style={{ fontSize: '20px', color: 'gray' }}>Fuel Level</h2>
<ResponsiveContainer width="100%" height={200} >
<LineChart data={Data} syncId="fuelChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="TIME" />
<YAxis label={{ value: 'Fuel (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} tickCount={6} />
<Tooltip />
<Brush height={20} startIndex={brushIndices.startIndex} onChange={handleBrushChange} />
<Line type="monotone" dataKey="FUEL_LEVEL" stroke="#8884d8" fill="#8884d8" isAnimationActive={false} animationDuration={0} />
</LineChart>
</ResponsiveContainer>

<h2 style={{ fontSize: '25px', color: 'gray' }}>Speed</h2>
<ResponsiveContainer width="100%" height={200}>
<LineChart data={Data} syncId="speedChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="TIME" />
<YAxis label={{ value: 'Speed km/h', angle: -90, position: 'insideLeft' }} domain={[0, 60]} tickCount={6} />
<Tooltip />
<Brush height={20} startIndex={brushIndices.startIndex} onChange={handleBrushChange} />
<Line type="monotone" dataKey="SPEED" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
</LineChart>
</ResponsiveContainer>

<h2 style={{ fontSize: '25px', color: 'gray' }}>RPM</h2>
<ResponsiveContainer width="100%" height={200}>
<AreaChart data={Data} syncId="rpmChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="TIME" />
<YAxis label={{ value: 'RPM', angle: -90, position: 'insideLeft' }} domain={[0, 3000]} tickCount={6} />
<Tooltip />
<Area type="monotone" dataKey="ENGINE_RPM" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
<Brush height={20} startIndex={brushIndices.startIndex} onChange={handleBrushChange} />
</AreaChart>
</ResponsiveContainer>


</div>
</div>
</div>
<Box sx={{ padding: 2 }}>
 <Card sx={{ overflow: 'scroll', height: '40vh' }}>
 <Divider />
 <Table stickyHeader>
 {!tableData.length ? <caption>No Previous Data</caption> : <></>}
 <TableHead sx={{ position: 'sticky', top: 0 }}>
 <TableRow>
 <TableCell sx={{ fontWeight: 'bold', color: '#000000 !important' }} align="center" colSpan={5}>
 Previous Trips
 </TableCell>
 </TableRow>
 <TableRow>
 <TableCell sx={{ color: '#000000 !important' }}>Date</TableCell>
 <TableCell sx={{ color: '#000000 !important' }}>HMR</TableCell>
 <TableCell sx={{ color: '#000000 !important' }}>Distance</TableCell>
 <TableCell sx={{ color: '#000000 !important' }}>Location</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {allDates.map((date) => {
 const entry = tableData.find((e) => e.date === date);
 if (entry) {
 return (
 <TableRow key={date}>
 <TableCell>{entry.date}</TableCell>
 <TableCell>{entry.hmr}</TableCell>
 <TableCell>{entry.distance} km</TableCell>
 <TableCell>{entry.location}</TableCell>
 </TableRow>
 );
 } else {
 return (
 <TableRow key={date}>
 <TableCell>{date}</TableCell>
 <TableCell colSpan={3} align="center" sx={{ fontStyle: 'italic', color: 'gray' }}>
 No data
 </TableCell>
 </TableRow>
 );
 }
 })}
 </TableBody>
 </Table>
 </Card>
</Box>

</div>

);
};

export default LiveMap;