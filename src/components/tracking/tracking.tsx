"use client"
import { TractorDetails } from "@/components/ecommerce/TractorDetails";
import React, { useEffect, useState } from "react";
// import Flatpickr from "react-flatpickr";
import 'flatpickr/dist/themes/material_blue.css';
import dynamic from "next/dynamic";
import { Badge, Box, Card, CardContent, Typography } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
// import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers";
import axios from "axios";

const LiveMap = dynamic(() => import('@/components/map/LiveMap'), { ssr: false });
const PathMap = dynamic(() => import('@/components/map/pathMap'), { ssr: false });
// const Flatpickr = dynamic(() => import('react-flatpickr'), { ssr: false });

interface tractor_props{
    tractor_id: string
}

interface Data {
  TIME: string;
  DEVICE_ID: string;
  LATITUDE: string;
  LONGITUDE: string;
  FUEL_LEVEL: string;
  SPEED: string;
  ENGINE_RPM: string;
  IGNITION: string;
}

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
}

const Tracking: React.FC<tractor_props> = ({ tractor_id }) => {
  // const [newData, setNewData] = useState<Data>(Object);
  const [date, setDate] = useState<string>('');
  const [today, setToday] = useState(dayjs().format('YYYY-MM-DD')); // Use Day.js
  const [status, setStatus] = useState<string>("Stopped");
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<string>('');
  const [availableDates,setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
 const fetchDetails = async () => {
 try {
 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/${tractor_id}`);
 let dates:string[]=[];
 console.log(res.data.resp)
 res?.data?.resp?.forEach((el: any) => {
  if (el?.date) dates.push(el.date);
});

console.log(dates);
 setAvailableDates(dates);
 }
 catch(err){
 console.log(err)
 }
 }

 fetchDetails(); 
 }, []);

  const renderDayWithBadge = (
    day: Dayjs,
    selectedDates: Dayjs[] | null,
    props: PickersDayProps<Dayjs>
  ) => {
    const isSpecialDate = (availableDates || []).some((availableDates) =>
      day.isSame(availableDates, "date")
    );

    return (
      <Badge
        badgeContent={isSpecialDate ? "" : null}
        color="primary"
        overlap="circular"
        sx={{
          "& .MuiBadge-badge": {
            fontSize: "0.6rem", 
            height: "10px",
            minWidth: "10px", 
            padding: "0", 
            backgroundColor: "#4FC978",
          },
        }}
      >
        <PickersDay {...props} />
      </Badge>
    );
  };


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

 // Handle date change correctly and set the selected date
 const handleDateChange = (newDate: Dayjs | null) => {
  if (newDate) {
    const formattedDate = newDate.format('YYYY-MM-DD');
    setDate(formattedDate);
    console.log("Selected Date:", formattedDate);
  }
};

  useEffect(() => {
    setToday(dayjs().format('YYYY-MM-DD')); // Set today's date using Day.js
  }, []);

  useEffect(() => {
    const fetchLastTimeStamp = async () => {
      try {
        // Make the API request
        const res = await axios.get(
          `https://fdcserver.escortskubota.com/fdc/tripData/historic?date=${date}&tractor_id=${tractor_id}`
        );
        console.log(res?.data?.result?.data?.at(-1).TIME); // Log the response
        setLastUpdatedTimestamp(res?.data?.result?.data?.at(-1).TIME); // Set the response data to state (if needed)
      } catch (err) {
        console.error("Error fetching data:", err); // Handle errors
      }
    };

    // Only run fetchData if `date` is not empty
    if (date) {
      fetchLastTimeStamp();
    }
  }, [date]); 

  function addTimeToCurrentTime(currentTime: string) {
    const additionalTime = "5:30";
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
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  let allData: ChartData[] = [];

  React.useEffect(() => {
    const socket = new WebSocket("wss://fdcserver.escortskubota.com/ws/"); // Change to your WebSocket server
    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event?.data);
        if (data && 
          data.DEVICE_ID == `${tractor_id}` &&
          data.DEVICE_ID && 
          data.LATITUDE !== "0.000000" &&
          data.LONGITUDE !== "0.000000" &&
          !isNaN(parseFloat(data.ENGINE_RPM)) &&
          !isNaN(parseFloat(data.FUEL_LEVEL)) &&
          !isNaN(parseFloat(data.SPEED))) {

          const commingData = {
            TIME: addTimeToCurrentTime(data.TIME),
            name: new Date().toLocaleTimeString(),
            DEVICE_ID: data.DEVICE_ID,
            LATITUDE: data.LATITUDE,
            LONGITUDE: data.LONGITUDE,
            ALTITUDE: data.ALTITUDE,
            FUEL_LEVEL: parseFloat(data.FUEL_LEVEL),
            SPEED: parseFloat(data.SPEED),
            ENGINE_RPM: parseFloat(data.ENGINE_RPM),
            IGNITION: parseFloat(data.IGNITION),
          };
          allData.push(commingData);
          setLastUpdatedTimestamp(data.TIME);
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
  const addTimeToString = (input: string) => {
    // Step 1: Extract the time part from the string
    const timePart = input.split(',')[1].split('+')[0]; // Extract '11:25:20'
  
    // Step 2: Parse the time using Day.js
    const time = dayjs(`1970-01-01T${timePart}`); // Use a fixed date (e.g., 1970-01-01) because Day.js requires a valid date
  
    // Step 3: Add 5 hours and 30 minutes
    const updatedTime = time.add(5, 'hour').add(30, 'minute');
    console.log(updatedTime);
    // Step 4: Return the updated time in 'hh:mm A' (AM/PM) format
    return updatedTime.format('hh:mm:ss A');
  };
  function checkStatus() {
    if (allData.length > 0) {
      const lastPos = allData[allData.length - 1];
      const lastTime = timeToSeconds(lastPos?.TIME);
      const currentDate = dayjs();
      const currentTime = timeToSeconds(currentDate.format('HH:mm:ss')); // Use Day.js

      if (lastPos.SPEED > 0)
        setStatus("Running");
      else if (lastPos.ENGINE_RPM > 650 && lastPos.IGNITION === 1.000000)
        setStatus("Cranked & Halted");
      else if (lastPos.ENGINE_RPM <= 650 && lastPos.IGNITION === 1.000000)
        setStatus("Ignition On");
      else
        setStatus("Stopped");
    }
  }

  React.useEffect(() => {
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
          <Card sx={{ borderRadius: 3, boxShadow: 3, transform: "scale(0.8)", width: '80%' }}>
            <CardContent sx={{ paddingLeft: '20px' }}>
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
          {(date === today || !date) ? (
            <Box sx={{
              width: '85px',
              padding: '1px 17px',
              margin: '10px',
              height: '25px',
              borderRadius: '7px',
              opacity: 0.9,
              ...getStatusStyle(status),
            }}>
              {status}
            </Box>
          ) : (<></>)}
        </div>
      </div>

      <div className="col-span-12 xl:col-span-6">
        <div style={{ padding: "25px" }} className="grid grid-cols-1 gap-4 md:gap-6">
          <div className="flex gap-6 items-center">
            {/* Date Picker */}
            <div className="flex-1">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Trip Date"
                        onChange={handleDateChange}
                        // value={value ? dayjs(value) : null}
                        slots={{
                          day: (props) => renderDayWithBadge(props.day, null, props),
                        }}
                      />
                    </LocalizationProvider>
            </div>

            {/* Last Updated Timestamp Box */}
            {lastUpdatedTimestamp && (
              <Box sx={{ width: '180px', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 5, px: 2, py: 0.5 }}>
                <Typography variant="caption" color="textSecondary">Last Updated Timestamp</Typography>
                <Typography variant="subtitle2">
                {addTimeToString(lastUpdatedTimestamp)}
                </Typography>
              </Box>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12 mt-5">
        {(date === today || !date) ? <LiveMap tractor_id={tractor_id} /> : <PathMap tractor_id={tractor_id} date={date} />}
      </div>
    </div>
  );
};

export default Tracking;
