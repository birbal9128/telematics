"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
import L, { LatLng, LatLngBounds, LatLngBoundsExpression, LatLngExpression, LatLngTuple } from 'leaflet';
import SpeedIcon from '@mui/icons-material/Speed';
import StraightenIcon from '@mui/icons-material/Straighten';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import OpacityIcon from '@mui/icons-material/Opacity';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import "leaflet/dist/leaflet.css";
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush, AreaChart, Area, ResponsiveContainer
} from 'recharts';
import axios from "axios";
import { Backdrop, Box, Button, Card, CardContent, Fade, Modal, Typography } from "@mui/material";

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

interface dateProps{
 date:string,
 tractor_id:string
}

const customIcon = L.icon({
 iconUrl: 'images/loaction.png', // put your image path here
 iconSize: [32, 32], // size of the icon
 iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
 popupAnchor: [0, -32] // point from which the popup should open relative to the iconAnchor
});
interface DTCData {
  code: string;
  status: '1.000000' | '2.000000' | '0.000000' | '-1';
  description:string;
}



// Function to get the color for each status
const getStatusColor = (status: '1.000000' | '2.000000' | '0.000000'| '-1'): string => {
  switch (status) {
    case '1.000000':
      return 'green';
    case '2.000000':
      return 'green';
    case '0.000000':
      return '#f24646';
    default:
      return '#f5f5f5';
  }
};

const convertStatusToMessage=(status: '1.000000' | '2.000000' | '0.000000'| '-1'): string=>{
  switch (status) {
    case '1.000000':
      return 'OK';
    case '2.000000':
      return 'OK';
    case '0.000000':
      return 'Faulty';
    default:
      return 'No Status';
  }
}


// Dynamic import for SSR fix
const Map = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayerComp = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const MarkerComp = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const PopupComp = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const PolylineComp = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

const PathMap: React.FC<dateProps> = ({ date,tractor_id }) => {
 const [data, setData] = useState<ChartData[]>([]);
 const [centerPosition, setCenterPosition] = useState<LatLngTuple>();
 const [position, setPosition] = useState<LatLngTuple[]>([]);
 const [distance, setDistance] = useState<number>(0);
 const [location, setLocation] = useState<string[]>([]); 
 const [HMR, setHMR] = useState<string>("00:00:00"); 
 const [engTemp, setEngTemp] = useState<number>(0);
const [fuelTemp, setFuelTemp] = useState<number>(0);
const [coolantTemp, setCoolantTemp] = useState<number>(0);
const [batteryVoltage, setBatteryVoltage] = useState<number>(0);
const [activeDTCs, setActiveDTCs] = useState<number>(0);
const [healedDTCs, setHealedDTCs] = useState<number>(0);
const [dtcData,setDtcData] = useState<DTCData[]>([
  { code: 'P0183-00', status: "-1", description:'Water in fuel'},
  { code: 'P0193-12', status: "-1", description:'Metering unit'},
  { code: 'P0251-13', status: "-1", description:'Rail pressure'},
  { code: 'P2264-13', status: "-1", description:'Fuel Temperature'},
]);
const [open, setOpen] = useState<boolean>(false);
const [selectedDtc, setSelectedDtc] = useState<string>('');
const handleOpen = (dtc: string) => {
  setSelectedDtc(dtc);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setSelectedDtc('');
};

 // Convert degrees to radians
const toRadians = (degree: number) => {
 return degree * (Math.PI / 180);
};

// Haversine formula to calculate the distance between two points in kilometers
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
 const R = 6371; // Earth radius in km
 const dLat = toRadians(lat2 - lat1);
 const dLon = toRadians(lon2 - lon1);
 const a =
 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
 Math.sin(dLon / 2) * Math.sin(dLon / 2);
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 return R * c; // Distance in km
};

const timeToSeconds = (time: string): number => {
 const [hours, minutes, seconds] = time.split(':').map(Number);
 return hours * 3600 + minutes * 60 + seconds;
};

const secondsToTime = (seconds: number): string => {
 const hours = Math.floor(seconds / 3600);
 const minutes = Math.floor((seconds % 3600) / 60);
 const secs = seconds % 60;

 return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

function calculateDecimal(number: number): string {
 const [integerPart, decimalPart] = number.toString().split(".")
 // console.log(decimalPart)
 const result = (parseInt(decimalPart) / 60); 
 const res = result.toString().replace('.', '');
 const firstSixDigits = res.slice(0, 6);
 const afterDecimal = parseInt(firstSixDigits)
 return `${Math.floor(number)}.${afterDecimal}`;
}


async function getLocationFromCoordinates(
 lat: number,
 lng: number
): Promise<string> {
 const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
 try {
 const response = await fetch(url);
 if (!response.ok) {
 throw new Error(`Error with the request: ${response.statusText}`);
 }
 const data: {
 display_name: string;
 } = await response.json();

 if (data && data.display_name) {
 return data.display_name;
 } else {
 return 'Location not found';
 }
 } catch (error) {
 console.log(error);
 return 'Error fetching location';
 }
}


 useEffect(() => {
 setData([])
 let HMR = 0
 const fetchDetails = async () => {
 try {
 
 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/historic?date=${date}&tractor_id=${tractor_id}`);
 console.log(res)
 if(res.status==200){
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
 const newData = res.data.result?.data
 .filter((item: any) => item.LATITUDE !== '0.000000' && item.LONGITUDE !== '0.000000'&& item.LATITUDE !== '0.0000' && item.LONGITUDE !== '0.0000' && item.LATITUDE !== 0 && item.LONGITUDE !== 0 ) 
 .map((item: any) => {
 const updatedEngineRpm = item.ENGINE_RPM < 649 ? 0 : item.ENGINE_RPM;
 
 return {
 "TIME": addTimeToCurrentTime(item.TIME),
 "DEVICE_ID": item.DEVICE_ID,
 "LATITUDE": calculateDecimal(item.LATITUDE),
 "LONGITUDE": calculateDecimal(item.LONGITUDE),
 "ALTITUDE": item.ALTITUDE,
 "SPEED": item.SPEED,
 "FUEL_LEVEL": item.FUEL_LEVEL,
 "ENGINE_RPM": updatedEngineRpm,
 "BATTERY_VOLTAGE":item.BATTERY_VOLTAGE,
 "ENG_TEMP":item.ENG_TEMP,
 "COOLANT_TEMP":item.COOLANT_TEMP,
 "FUEL_TEMP":item.FUEL_TEMP,
 "P2264_13":item["P2264-13"],
 "P0193_12":item["P0193-12"],
 "P0251_13":item["P0251-13"],
 "P0183_00":item["P0183-00"]
 };
 })
 .filter((value:any, index:any, self:any) => {
 return index === self.findIndex((t:any) => (
 t.TIME === value.TIME
 ));
 });

 setData(newData)
 console.log(newData)
 const allData = newData
 console.log(allData)
 let totalDistance = 0
 let allDataLength = allData.length
 let lastPostion = allData[allDataLength-1]
 console.log(lastPostion)
 const latitude = parseFloat(lastPostion?.LATITUDE); 
 const longitude = parseFloat(lastPostion?.LONGITUDE);
 console.log(latitude,longitude)
 const location = await getLocationFromCoordinates(latitude, longitude);
 const locationArray = location.split(",")
 let active=0,healed=0;
 setLocation(locationArray)
 console.log(allData)
 setDtcData(()=>{
  return [
      { code: 'P0183-00', status: lastPostion["P0183_00"], description:'Water in fuel'},
      { code: 'P0193-12', status: lastPostion["P0193_12"], description:'Metering unit'},
      { code: 'P0251-13', status: lastPostion["P0251_13"], description:'Rail pressure'},
      { code: 'P2264-13', status: lastPostion["P2264_13"], description:'Fuel Temp'},
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
setEngTemp(parseFloat(lastPostion.ENG_TEMP));
 setCoolantTemp(parseFloat(lastPostion.COOLANT_TEMP));
 setFuelTemp(parseFloat(lastPostion.FUEL_TEMP));
 setBatteryVoltage(parseFloat(lastPostion.BATTERY_VOLTAGE));
setActiveDTCs(active)
setHealedDTCs(healed)
 // Loop through the coordinates and calculate distance between consecutive points
 for (let i = 0; i < allData.length - 1; i++) {
 const current = allData[i];
 const next = allData[i + 1];
 
 const lat1 = parseFloat(current.LATITUDE);
 const lon1 = parseFloat(current.LONGITUDE);
 const lat2 = parseFloat(next.LATITUDE);
 const lon2 = parseFloat(next.LONGITUDE);
 if(next.TIME != "Error: Invalid time format" && current.TIME != "Error: Invalid time format"){
 const dif = timeToSeconds(next.TIME) - timeToSeconds(current.TIME)
 if(lat1 != lat2 || lon1 != lon2){
 if(dif<=1200 && dif>0){
 HMR += dif
 }
 }
 }
 
 totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
 }
 console.log(secondsToTime(HMR))
 setHMR(secondsToTime(HMR))
 setDistance(totalDistance)
 }
 else{
 console.log("failed to load data")
 }

 } catch (err) {
 console.log(err)
 } 
 };

 fetchDetails(); 
 }, [date]);

 useEffect(() => {
 // Only set center position when positions array is updated
 if (data?.length > 0) {
 const positions:LatLngTuple[] = data.map(point => [parseFloat(point.LATITUDE), parseFloat(point.LONGITUDE)]);
 console.log(positions)
 setPosition(positions)
 // if (positions?.length > 0) {
 // const latestPosition: LatLngTuple = [positions[0][0],positions[0][1]]; // Get the latest position from the array
 // setCenterPosition(latestPosition); // Only update center position if it changes
 // }
 }
 }, [data]);

 useEffect(() => {
 // Only set center position when positions array is updated
 console.log(position)
 console.log("Yes sir i am running")
 if (position?.length > 0) {
 console.log("Yes sir i am running inside loop")
 const latestPosition: LatLngTuple = [position[0][0],position[0][1]]; // Get the latest position from the array
 console.log(latestPosition)
 setCenterPosition(latestPosition); // Only update center position if it changes
 }
 }, [position]);

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
 return (
<>
{data?
<div style={{ display: 'flex', width: '100%',flexWrap:'wrap' }}>
 {/* Left side: Stats Section */}
 <div style={{
 flex: 1, // Make it take up 50% of the container
 display: 'flex', 
 flexDirection: 'column', 
 margin:'16.8px',
 marginTop:'2px'
 }}>
 <div style={{display:'flex'}}>
 <Box sx={{ padding: 1 }}>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          marginTop: 0,
        }}
      >
        <TelemetryCard icon={<StraightenIcon />} label="Distance" value={distance.toFixed(2)} unit="km" />
        <TelemetryCard icon={<AccessAlarmIcon />} label="HMR" value={HMR} />
        {batteryVoltage?<TelemetryCard icon={<BatteryFullIcon />} label="Battery Voltage" value={batteryVoltage.toFixed(2)} unit="V" />:<></>}
        {engTemp?<TelemetryCard icon={<WhatshotIcon />} label="Engine Temp" value={engTemp.toFixed(2)} unit="°C" />:<></>}
        {fuelTemp?<TelemetryCard icon={<OpacityIcon />} label="Fuel Temp" value={fuelTemp.toFixed(2)} unit="°C" />:<></>}
        {coolantTemp?<TelemetryCard icon={<DeviceThermostatIcon />} label="Coolant Temp" value={coolantTemp.toFixed(2)} unit="°C" />:<></>}
        <TelemetryCard icon={<LocationOnIcon />} label="Location" value={location[0]} />
      </Box>
    </Box>

 </div>
 

 {centerPosition?<Map center={centerPosition} zoom={15} style={{marginLeft:'15px', height: "500px", width: "95%", marginTop:"20px" }}>
 <TileLayer
    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    zIndex={1}
  />
  
  {/* Transparent labels overlay */}
  {/* <TileLayer
    url="https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
    zIndex={2}
  /> */}

 {position?.length > 1 && (
 <PolylineComp positions={position} color="blue" weight={3} />
 )}
 </Map>:<>Map is loading .......</>}
 </div>

 {/* Right side: Map and Charts Section */}
 <div style={{
 flex: 1, // Take up 50% of the width
 display: 'flex',
 flexDirection: 'column'
 }}>
 <Box sx={{ textAlign: 'center' }}>

{/* Displaying DTC codes with their status */}
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
</Box>

 <div style={{paddingLeft:'30px', width: '100%' }}>
 <h2 style={{ fontSize: '25px', color: 'gray' }}>Fuel Level</h2>
 <ResponsiveContainer width="100%" height={200} >
 <LineChart data={data} syncId="fuelChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="TIME" />
 <YAxis label={{ value: 'Fuel (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} tickCount={6} />
 <Tooltip />
 <Line type="monotone" dataKey="FUEL_LEVEL" stroke="#8884d8" fill="#8884d8" isAnimationActive={false} animationDuration={0} />
 <Brush height={20} />
 </LineChart>
 </ResponsiveContainer>

 <h2 style={{ fontSize: '25px', color: 'gray' }}>Speed</h2>
 <ResponsiveContainer width="100%" height={200}>
 <LineChart data={data} syncId="speedChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="TIME" />
 <YAxis label={{ value: 'km/h', angle: -90, position: 'insideLeft' }} domain={[0, 60]} tickCount={6} />
 <Tooltip />
 <Line type="monotone" dataKey="SPEED" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
 <Brush height={20} />
 </LineChart>
 </ResponsiveContainer>

 <h2 style={{ fontSize: '25px', color: 'gray' }}>RPM</h2>
 <ResponsiveContainer width="100%" height={200}>
 <AreaChart data={data} syncId="rpmChart" margin={{ top: 10, right: 50, left: 0, bottom: 20 }}>
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="TIME" />
 <YAxis label={{ value: 'RPM', angle: -90, position: 'insideLeft' }} domain={[0, 3500]} tickCount={6} />
 <Tooltip />
 <Area type="monotone" dataKey="ENGINE_RPM" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
 <Brush height={20} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>:<div>No data avilable</div>}
</>


 );
};

export default PathMap;