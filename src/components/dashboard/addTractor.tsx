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
  TractorId: zod.string().min(1, "Tractor ID is required"),
  TractorName: zod.string().min(1, "Tractor Name is required"),
  TractorNumber: zod.string().min(1, "Tractor Number is required"),
  ECUType: zod.string().min(1, "Please select ECU Type"),
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
ECUType:''

 }, resolver: zodResolver(schema)
 });

 const dropdown = ["CRDI", "Non-CRDI"]



 const onSubmit: SubmitHandler<Values> = async (data) => {
 try {

const { TractorId, TractorName, TractorNumber, ECUType } = data;

const res = await axios.post(
  `https://fdcserver.escortskubota.com/fdc/tractor/initiate?TractorId=${TractorId}&TractorName=${TractorName}&TractorNumber=${TractorNumber}&type=${ECUType}`
);
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
    position: "fixed",
    inset: 0,
    bgcolor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    p: 2,
    zIndex: 1300,
  }}
>
<Card
  sx={{
    width: "95%",
    maxWidth: 700,
    borderRadius: 4,
    boxShadow: 10,
  }}
>
  <CardHeader
    title="🚜 Add Tractor"
    subheader="Enter tractor information"
    sx={{
      bgcolor: "primary.main",
      color: "white",
      "& .MuiCardHeader-subheader": {
        color: "rgba(255,255,255,0.8)",
      },
    }}
  />

  <CardContent sx={{ pt: 4 }}>
    <Grid container spacing={3}>

      {/* Tractor ID */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="TractorId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Tractor ID"
              error={!!errors.TractorId}
              helperText={errors.TractorId?.message}
            />
          )}
        />
      </Grid>

      {/* Tractor Model */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="TractorName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Tractor Model"
              error={!!errors.TractorName}
              helperText={errors.TractorName?.message}
            />
          )}
        />
      </Grid>

      {/* Tractor Number */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="TractorNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Tractor Number"
              placeholder="DL01AB1234"
              error={!!errors.TractorNumber}
              helperText={errors.TractorNumber?.message}
            />
          )}
        />
      </Grid>

      {/* Engine type */}
<Grid size={{ xs: 12, md: 6 }}>
  <Controller
    name="ECUType"
    control={control}
    render={({ field }) => (
      <FormControl fullWidth>
        <InputLabel id="ecu-type-label">ECU Type</InputLabel>

        <Select
          labelId="ecu-type-label"
          label="ECU Type"
          value={field.value || ""}
          onChange={(e) => field.onChange(e.target.value)}
        >
          <MenuItem value="">
            <em>Select ECU Type</em>
          </MenuItem>

          {dropdown.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>

        {errors.ECUType && (
          <FormHelperText error>
            {errors.ECUType.message}
          </FormHelperText>
        )}
      </FormControl>
    )}
  />
</Grid>

    </Grid>
  </CardContent>

  <Divider />

  <CardActions
    sx={{
      p: 3,
      justifyContent: "space-between",
    }}
  >
    <Button
      variant="outlined"
      color="inherit"
      onClick={() => setModal(false)}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      type="submit"
      disabled={isPending}
      size="large"
    >
      {isPending ? "Saving..." : "Save Tractor"}
    </Button>
  </CardActions>
</Card>
 </Box>
 </form>
 </>
 );
}

export default AddTractor;
