

import { Request, Response } from "express";
import { publishEvent } from "../events/publisher";
import asyncHandler from "express-async-handler"
import Pharmacy from "../models/pharmacy.model"




// export const createOrUpdateStock = asyncHandler(async(req:Request,res: Response) =>{
//     const { productImage, name, price, offerPrice, purchaseDate, expireDate, unit, stock, description, category} = req.body;

//     const exist =await pharmacy.findOne({where:{
//     name,
//     unit,
//     expireDate,}});
//     if (exist){
//         res.status(400).json({
//             success: false,
//             message:"Medicine already exist",
//             data:null,
//             error:{code: "MEDICINE_ALREADY_EXISTS", details: null},
//         });
//         return;
//     }
// })







export const createOrUpdatestock: any = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      productImage,
      name,
      price,
      offerPrice,
      purchaseDate,
      expireDate,
      unit,
      stock,
      description,
      category,
    } = req.body;

    // Check existing medicine (better condition)
    const exist = await Pharmacy.findOne({
      where: { name, unit },
    });

    if (exist) {
      // 👉 Update stock
    //   exist.stock += stock;
      exist.stock += Number(stock || 0);
      await exist.save();

      res.status(200).json({
        success: true,
        message: "Stock updated successfully",
        data: exist,
      });
      return;
    }

    // 👉 Create new medicine
    const newMedicine = await Pharmacy.create({
      productImage,
      name,
      price,
      offerPrice,
      purchaseDate,
      expireDate,
      unit,
      stock,
      description,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: newMedicine,
    });
  }
);




export const getPharmacy: any = asyncHandler(async (req:Request, res:Response )=>{
    const pharmacy = await Pharmacy.findByPk(req.params.id);
    if (!pharmacy) {
        res.status(404).json({
            success: false,
            message: "medicine not found",
            data: null,
            error:{code:"MEDICINE_NOT_FOUND", details:null },
        });
        return;
    }
    res.status(200).json({
        success: true,
        message: "Medicine fetched successfully",
        data: pharmacy,
    });
})






export const getPharmacies: any = asyncHandler(async (req: Request, res: Response) =>{
    const pharmacies = await Pharmacy.findAll();

    if (pharmacies.length === 0){
        res.status(404).json({
            success: false,
            message:"No data found",
            data: null,
            error: { code: "NO_DATA_FOUND", details: null },
        });
        return;
    } 

    const safePharmacy = pharmacies.map(Pharmacy =>{
        const json: any = Pharmacy.toJSON();
        delete json.createdAt;
        delete json.updatedAt;
        delete json.deletedAt;
        return json;
    })
    res.status(200).json({
        success: true,
        message: "Pharmacies fetched successfully",
        data: safePharmacy,
    })
})





export const deletePharmacy: any =  asyncHandler(async (req: Request, res: Response) => {
const {id} =req.params;

const pharmacy = await Pharmacy.findByPk(id);
if(!pharmacy){
    res.status(404).json({
        success: false,
        message: "medicine not found",
        data: null,
        error:{code: "MEDICINE_NOT_FOUND", details:null },
    });
    return;
}

await pharmacy.destroy();

await publishEvent("pharmacy_queue", "PHARMACY_DELETED", {
    pharmacyId: id,
});

res.status(200).json({
    success: true,
    message: "Pharmacy deleted successfully",
    data: null,
    error: null,
});
});
    
