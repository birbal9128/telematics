'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';

import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import { z as zod } from 'zod'
import { Box, Grid } from '@mui/system';
import { Typography } from '@mui/material';
import axios from 'axios';

const schema = zod.object({
 TractorId: zod.coerce.string(),
 TractorName: zod.coerce.string(),
 TractorNumber: zod.coerce.string(),
 EngineNumber: zod.coerce.string(),
 ChassisNumber: zod.coerce.string(),
});
export type Values = zod.infer<typeof schema>;

interface addTractorProps {
 setModal: React.Dispatch<React.SetStateAction<boolean>>;
 setAddTractorAlert: React.Dispatch<React.SetStateAction<boolean>>;
 setFaidAddTractorAlert: React.Dispatch<React.SetStateAction<boolean>>;
 }

 const AddTractor: React.FC<addTractorProps> = ({setModal, setAddTractorAlert,setFaidAddTractorAlert}) => {
 const [isPending, setIsPending] = useState<boolean>();
 const [farmAlert, setFarmAlert] = useState<boolean>(false);

 const { control, handleSubmit,setValue, formState: { errors } } = useForm<Values>({
 defaultValues: {
 TractorId:'',
 TractorName:'',
 TractorNumber:'',
EngineNumber:'',
ChassisNumber:''

 }, resolver: zodResolver(schema)
 });



 const onSubmit: SubmitHandler<Values> = async (data) => {
 try {
 console.log({...data});
 const TractorId= data.TractorId
 const TractorName = data.TractorName;
 const TractorNumber = data.TractorNumber
 const res = await axios.post(`https://fdcserver.escortskubota.com/fdc/tractor/initiate`, {
 TractorId,TractorName,TractorNumber
 })
 console.log(res)
 if(res?.data?.success == true){
 setModal(false)
 setAddTractorAlert(true)
 }
 else{
 setModal(false)
 setFaidAddTractorAlert(true);
 }
 }
 catch (err) {
 console.log(err);
 setModal(false)
 setFaidAddTractorAlert(true);
 }
 finally {
 setIsPending(false)
 }
 }

 return (
 <>
 <form onSubmit={handleSubmit(onSubmit)}>
 <Box
 sx={{
 position: 'fixed',
 top: 0,
 left: 0,
 width: '100%',
 height: '100%',
 display: 'flex',
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: 'rgba(0, 0, 0, 0.7)',
 zIndex: 1111,
 }}>
 <Card sx={{ width: '90%', maxWidth: 500 }}>
 <CardHeader title="Add Tractor Data" />
 <Divider />
 <CardContent>
 <Grid container spacing={3}>

 <Controller
 name="TractorId"
 control={control}
 render={({ field }) => (
 <FormControl fullWidth>
 <InputLabel>Tractor ID</InputLabel>
 <OutlinedInput {...field} label="Tractor ID" />
 
 </FormControl>
 )}
 />

 <Controller
 name="TractorName"
 control={control}
 render={({ field }) => (
 <FormControl fullWidth>
 <InputLabel>Tractor Model</InputLabel>
 <OutlinedInput {...field} label="Tractor Model" />
 
 </FormControl>
 )}
 />

 <Controller
 name="TractorNumber"
 control={control}
 render={({ field }) => (
 <FormControl fullWidth>
 <InputLabel>Tractor Number</InputLabel>
 <OutlinedInput {...field} label="Tractor Number" />
 
 </FormControl>
 )}
 />

<Controller
 name="EngineNumber"
 control={control}
 render={({ field }) => (
 <FormControl fullWidth>
 <InputLabel>Engine Number</InputLabel>
 <OutlinedInput {...field} label="Engine Number" />
 
 </FormControl>
 )}
 />

<Controller
 name="ChassisNumber"
 control={control}
 render={({ field }) => (
 <FormControl fullWidth>
 <InputLabel>Chassis Number</InputLabel>
 <OutlinedInput {...field} label="Chassis Number" />
 
 </FormControl>
 )}
 />


 </Grid>
 </CardContent>
 <Divider />
 <CardActions sx={{ justifyContent: 'flex-end' }}>
 <Button disabled={isPending} variant="contained" onClick={() => setModal(false)}>Cancel</Button>
 <Button disabled={isPending} variant="contained" type="submit">Save</Button>
 </CardActions>
 </Card>
 </Box>
 </form>
 </>
 );
}

export default AddTractor;
