import * as React from 'react';
import type { Metadata } from 'next';
import Dashboard from '@/components/dashboard/dashboard';
import Tracking from '@/components/tracking/tracking';



export default async function Page({params}:{params:Promise<{tractor_id:string, tractor_number:string}>}): Promise<React.JSX.Element> {
  const {tractor_id, tractor_number} = await params; 
  return (
   <Tracking tractor_id={tractor_id} tractor_number={tractor_number}/>
  );
}
