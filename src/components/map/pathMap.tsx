"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
import L, { LatLng, LatLngBounds, LatLngBoundsExpression, LatLngExpression, LatLngTuple } from 'leaflet';
import "leaflet/dist/leaflet.css";
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush, AreaChart, Area, ResponsiveContainer
} from 'recharts';
import axios from "axios";

interface WebSocketData {
 DEVICE_ID: string;
 TIME: string;
 FUEL_LEVEL: string;
 SPEED: string;
 ENGINE_RPM: string;
}

interface ChartData {
 name: string;
 DEVICE_ID: string;
 FUEL_LEVEL: number;
 SPEED: number;
 ENGINE_RPM: number;
 LATITUDE:string;
 LONGITUDE:string
}

interface _Data {
 TIME: string;
 DEVICE_ID: string;
 LATITUDE:string;
 LONGITUDE:string
 FUEL_LEVEL: string;
 SPEED: string;
 ENGINE_RPM: string;
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
 const [distance, setDistance] = useState<number>();
 const [location, setLocation] = useState<string[]>([]); 
 const [HMR, setHMR] = useState<string>(); 

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
 "ENGINE_RPM": updatedEngineRpm 
 };
 })
 .filter((value:any, index:any, self:any) => {
 return index === self.findIndex((t:any) => (
 t.TIME === value.TIME
 ));
 });

 setData(newData)
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
 setLocation(locationArray)
 console.log(allData)
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

 return (
<>
{data?<div style={{ display: 'flex', width: '100%' }}>
 {/* Left side: Stats Section */}
 <div style={{
 flex: 1, // Make it take up 50% of the container
 display: 'flex', 
 flexDirection: 'column', 
 margin:'16.8px'
 }}>
 <div style={{display:'flex'}}>
 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px', 
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
 maxWidth: '160px', 
 margin: '0 auto',
 flex: '1 1 calc(33% - 16.8px)', // Adjust for 3 items in a row
 minWidth: '150px'
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>Distance travelled</p>
 <div style={{
 display: 'flex', 
 flexDirection: 'row', 
 gap: '25.2px', 
 justifyContent: 'center', 
 alignItems: 'center'
 }}>
 <div style={{ 
 display: 'flex', 
 flexDirection: 'row',
 gap:"4.2px"
 }}>
 <img src={dis.src} alt="Image" style={{ height: "25.2px" }} />
 <p style={{ color: '#4186E5', fontSize: '18px' }}>{distance?.toFixed(2)} km</p>
 </div>
 </div>

 </div>

 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px', 
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
 maxWidth: '160px', 
 margin: '0 auto',
 flex: '1 1 calc(33% - 16.8px)', // Adjust for 3 items in a row
 minWidth: '150px'
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>HMR</p>
 <div style={{
 display: 'flex', 
 flexDirection: 'row', 
 gap: '25.2px', 
 justifyContent: 'center', 
 alignItems: 'center'
 }}>
 <div style={{ 
 display: 'flex', 
 flexDirection: 'row',
 gap:"4.2px"
 }}>
 <img src={dis.src} alt="Image" style={{ height: "25.2px" }} />
 <p style={{ color: '#4186E5', fontSize: '18px' }}>{HMR}</p>
 </div>
 </div>

 </div>

 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px', 
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
 maxWidth: '160px', 
 margin: '0 auto',
 flex: '1 1 calc(33% - 16.8px)', // Adjust for 3 items in a row
 minWidth: '150px'
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>Location</p>
 <div style={{
 display: 'flex', 
 flexDirection: 'row', 
 gap: '25.2px', 
 justifyContent: 'center', 
 alignItems: 'center'
 }}>
 <div style={{ 
 display: 'flex', 
 flexDirection: 'row',
 gap:"4.2px"
 }}>
 <img src={dis.src} alt="Image" style={{ height: "25.2px" }} />
 <p style={{ color: '#4186E5', fontSize: '18px' }}>{location.slice(0, 2).join(', ')}</p>
 </div>
 </div>

 </div>
 </div>
 

 {centerPosition?<Map center={centerPosition} zoom={15} style={{ height: "500px", width: "100%", marginTop:"20px" }}>
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
 

 <div style={{ width: '100%' }}>
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
