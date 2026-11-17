export interface Farmer {
    id: number,
    name: string,
    phone_number: string
  }
  export interface Farm {
    id: number,
    current_crop: string,
    farm_name: string,
    sowing_date: Date,
    area: number,
    user_id: string,
  }