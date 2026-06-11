"use client";
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Alert, Button, Card, Divider, Typography } from '@mui/material';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import { useRouter } from 'next/navigation';
import { Box, Stack } from '@mui/system';
import axios from 'axios';
import AddTractor from '@/components/dashboard/addTractor';
import AddIcon from '@mui/icons-material/Add';
import { Loader } from '@/components/loader/laoder';


interface ChartData {
  name: string;
  TIME: string;
  LATITUDE: string;
  LONGITUDE: string;
  ALTITUDE: string;
  DEVICE_ID: string;
  FUEL_LEVEL: number;
  SPEED: number;
  ENGINE_RPM: number;
  IGNITION: number;
  lastUpdated: number;
}


 interface TractorData {
   id:number;
   TractorId: string;
   TractorName: string;
   TractorNumber: string;
   TestingInitiatedOn: string;
   type: string;
   status: string;
   todayDistance : string;
   todayHMR : string,
   totalDistance: string;
   totalHMR: string;
 }

// Sample data for the table

export default function Dashboard() {
 const router = useRouter();
 const [allData, setAllData] = React.useState<ChartData[]>([]);
 const [addTractorAlert, setAddTractorAlert] = React.useState(false);
 const [faidAddTractorAlert, setFaidAddTractorAlert] = React.useState(false);
 const [modal, setModal] = React.useState(false);
const [isPending, setIsPending] = React.useState<boolean>(true);
const [tractorData, setTractorData] = React.useState<TractorData[]>([]);
const [, setRefresh] = React.useState(0);

React.useEffect(() => {
  const interval = setInterval(() => {
    setRefresh((prev) => prev + 1);
  }, 6000);

  return () => clearInterval(interval);
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

 const timeToSeconds1 = (time: string): number => {
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

 
 React.useEffect(() => {
 const socket = new WebSocket("wss://fdcserver.escortskubota.com/ws/"); // Change to your WebSocket server ws://localhost:8080 wss://fdcserver.escortskubota.com/ws/
 socket.onopen = () => {
 console.log("Connected to WebSocket");
 };
 
 socket.onmessage = (event) => {
 try {
//  console.log("Event data",event?.data)
 const data = JSON.parse(event?.data);
 if (data && data.DEVICE_ID) {
 
const commingData = {
  TIME: data.TIME.trim(),
  name: new Date().toLocaleTimeString(),
  DEVICE_ID: data.DEVICE_ID.trim(),
  LATITUDE: data.LATITUDE,
  LONGITUDE: data.LONGITUDE,
  ALTITUDE: data.ALTITUDE,
  FUEL_LEVEL: parseFloat(data.FUEL_LEVEL),
  SPEED: parseFloat(data.SPEED),
  ENGINE_RPM: parseFloat(data.ENGINE_RPM),
  IGNITION: parseFloat(data.IGNITION),
  lastUpdated: Date.now(),
};
setAllData(prev => {
  const updated = [...prev];
  console.log(commingData)

  const index = updated.findIndex(
    item => item.DEVICE_ID === commingData.DEVICE_ID
  );

  if (index !== -1) {
    updated[index] = commingData; // replace latest data
  } else {
    updated.push(commingData);
  }

  return updated;
});

 
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
 const fetchAllTractor = async () => {
 try {
   const res = await axios.get("https://fdcserver.escortskubota.com/fdc/tractor/all");
   const tractors = res?.data?.data
   console.log(tractors);
   setTractorData(tractors)
   setIsPending(false)
   }
   catch (err) {
      console.error("Error fetching data:", err);
      setIsPending(false)
   }
   };

 fetchAllTractor();
}, []);

const getTractorStatus = (data: any) => {
  if (!data) return "Stopped";

  const ignition = Number(data.IGNITION);
  const speed = Number(data.SPEED);
  const rpm = Number(data.ENGINE_RPM);
  console.log(Date.now(), data.lastUpdated)
  console.log(Date.now() - data.lastUpdated)

  // No packet received for 30 seconds
  if (Date.now() - data.lastUpdated > 30000) {
    return "Stopped";
  }

  if (ignition === 1 && speed > 0 && rpm > 0) {
    return "Running";
  }

  if (ignition === 1 && speed === 0 && rpm > 0) {
    return "Cranked & Halted";
  }

  if (ignition === 0) {
    return "Ignition On";
  }

  return "Stopped";
};

React.useEffect(() => {
  if (addTractorAlert) {
    const timer = setTimeout(() => {
      setAddTractorAlert(false);
    }, 5000);

    return () => clearTimeout(timer);
  }
}, [addTractorAlert]);

React.useEffect(() => {
  if (faidAddTractorAlert) {
    const timer = setTimeout(() => {
      setFaidAddTractorAlert(false);
    }, 5000);

    return () => clearTimeout(timer);
  }
}, [faidAddTractorAlert]);



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
<div style={{ display: 'flex', justifyContent: 'flex-end', marginRight:"24px" , marginBottom: "20px"}}>
 <Stack direction="row" spacing={2}>
 <Button variant="contained" onClick={handleAddTractor} startIcon={<AddIcon />}>
 Add Tractor
 </Button>
 {modal && <AddTractor setModal={setModal} setAddTractorAlert={setAddTractorAlert} setFaidAddTractorAlert={setFaidAddTractorAlert}/>}
 </Stack>
 </div>

 <Card sx={{ overflow: 'scroll', height: '75vh' }}>
        <Divider />
        <Table stickyHeader>
          {tractorData.length ==0 ? <caption style={{textAlign:'center',marginTop:10}}>No farm Found</caption>:<></>}
          <TableHead sx={{ position: 'sticky', top: 0 , zIndex:999}}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' ,color: '#000000 !important'}} align="center" colSpan={10}>
                Tractor Dashboard
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Tractor ID</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Tractor name</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Tractor Number</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Testing Initiated On</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>HMR (HH:MM:SS)</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Distance Travelled</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Today's HMR (HH:MM:SS)</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Today's Distance</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>Status</TableCell>
              <TableCell sx={{fontWeight: 'bold' ,color: '#000000 !important'}}>View Details</TableCell>
              
            </TableRow>
          </TableHead>
          <TableBody>

          {tractorData.map((tractor) => (
                  <TableRow sx={{zIndex:1}} key={tractor.id}>
                    <TableCell>{tractor.TractorId}</TableCell>
                    <TableCell>{tractor.TractorName}</TableCell>
                    <TableCell>{tractor.TractorNumber}</TableCell>
                    <TableCell>{tractor.TestingInitiatedOn}</TableCell>
                    <TableCell>{tractor.totalHMR}</TableCell>
                    <TableCell>{parseFloat(tractor.totalDistance).toFixed(2)}</TableCell>
                    <TableCell>{tractor.todayHMR}</TableCell>
                    <TableCell>{parseFloat(tractor.todayDistance).toFixed(2)}</TableCell>
                  <TableCell>
                     {(() => {
                        const latestData = allData.find(
                           (item) => item.DEVICE_ID === tractor.TractorId
                        );

                        const status = getTractorStatus(latestData);

                        return (
                           <Box
                           sx={{
                              ...getStatusStyle(status),
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              textAlign: "center",
                              fontWeight: 600,
                              minWidth: 120,
                           }}
                           >
                           {status}
                           </Box>
                        );
                     })()}
                     </TableCell>
                    {/* <TableCell>{tractor.TestingInitiatedOn}</TableCell> */}
                    <TableCell>
                      <Button
                      sx={{backgroundColor:'#00A9AC'}}
                      
                        onClick={() => {
                          router.push(`/tracking/${tractor.TractorId}/${encodeURIComponent(tractor.TractorNumber)}`);
                        }}
                        variant="contained"
                        startIcon={<ViewIcon />}
                      >
                        View
                      </Button>
                    </TableCell>
        
                  </TableRow>))}
          </TableBody>
        </Table>
      </Card>

   {addTractorAlert&&<Alert color='success'>Tractor Added Successfully</Alert>}
   {faidAddTractorAlert&&<Alert color='error'>Failed to Add Tractor</Alert>}
      {isPending && <Loader />}
</>
 );
}
