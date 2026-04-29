import { Request, Response } from "express";
import Ad from "../models/ad.model";
import axios from "axios";
import dotenv from "dotenv";
import { Op, literal } from "sequelize";

dotenv.config();

// ✅ Create Donor
export const createAd = async (req: Request, res: Response): Promise<any> => {
  try {
    const { imageUrl, startDate, endDate, kilometer, hospitalId } = req.body;


      const  hospital = await axios.get(`${process.env.HOSPIT}/hospital/${hospitalId}`)


      if(!hospital){
              return res.status(404).json({ message: "Not found" });

      }


    const ad = await Ad.create({
      imageUrl, startDate, endDate, kilometer, hospitalId,  latitude: hospital?.data?.data?.latitude, longitude: hospital?.data?.data?.longitude,
    } as any);

    return res.status(201).json({
      message: "Ad created",
      ad,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// 🔍 Get All ad (with filters)

export const getAds = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { lat, lng } = req.query;

    let ads: any;

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);

      // Haversine Formula (distance in KM)
      const distanceFormula = literal(`
        (
          6371 * acos(
            cos(radians(${userLat}))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(${userLng}))
            + sin(radians(${userLat}))
            * sin(radians(latitude))
          )
        )
      `);

      ads = await Ad.findAll({
        attributes: {
          include: [[distanceFormula, "distance"]],
        },

        where: {
          isActive: true,

          startDate: {
            [Op.lte]: new Date(),
          },

          endDate: {
            [Op.gte]: new Date(),
          },

          [Op.and]: literal(`
            (
              (
                6371 * acos(
                  cos(radians(${userLat}))
                  * cos(radians(latitude))
                  * cos(radians(longitude) - radians(${userLng}))
                  + sin(radians(${userLat}))
                  * sin(radians(latitude))
                )
              ) <= kilometer
            )
          `),
        },

        order: [["createdAt", "DESC"]],
      });

      // If no nearby ads → show all active ads
      if (ads.length === 0) {
        ads = await Ad.findAll({
          where: {
            isActive: true,
          },
          order: [["createdAt", "DESC"]],
        });
      }

    } else {
      // No location → show all ads
      ads = await Ad.findAll({
        where: {
          isActive: true,
        },
        order: [["createdAt", "DESC"]],
      });
    }

    res.json({ ads });

  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// 📄 Get Single ad
export const getSingleAd = async (req: Request, res: Response): Promise<any> => {
  try {
    const ad = await Ad.findByPk(req.params.id);

    if (!ad) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(ad);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update
export const updateAd = async (req: Request, res: Response): Promise<any> => {
  try {
    const ad = await Ad.findByPk(req.params.id);

    if (!ad) {
      return res.status(404).json({ message: "Not found" });
    }

    await ad.update(req.body);

    res.json({ message: "Updated", ad });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete
export const deleteAd = async (req: Request, res: Response): Promise<any> => {
  try {
    const ad = await Ad.findByPk(req.params.id);

    if (!ad) {
      return res.status(404).json({ message: "Not found" });
    }

    await ad.destroy();

    res.json({ message: "Deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
