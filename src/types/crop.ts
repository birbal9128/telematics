export interface Cropnames {
    id: number,
    crop_name: string,
    crop_type:string
  }
  export interface Variety {
    id: number,
    variety: string,
  }
  export interface Crop{
    id:number,
    farm_id:number,
    farmer_id:number,
    crop_name:string,
    variety:string,
    sowing_date:string,
    plantation_date:string,
    pruning_date:string,
    avg_yield:number,
    number_of_rows:number,
    number_of_plants:number,
    row_spacing:number,
    plant_spacing:number,
    assignee:number,
    harversting_date:string,
    age_of_crop:number,
    farm_name:string
  }
  export interface SaveCropResponse {
    data: {
      success: boolean;
      duplicates: boolean;
    };
  }

  export interface FetchCropTypeResponse {
    data: {
      success: boolean;
      crop_type: string;
    };
  }

  export interface FetchUser {
    success: boolean;
    data: [
      {
      userDetails: object;
    }
  ]
  }