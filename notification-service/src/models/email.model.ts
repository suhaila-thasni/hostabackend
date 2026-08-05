import { DataTypes } from "sequelize";
import sequelize from "../config/db";

const EmailNotification = sequelize.define("EmailNotification",{

    hospitalId:{
        type:DataTypes.INTEGER
    },

    createdBy:{
        type:DataTypes.INTEGER
    },

    subject:{
        type:DataTypes.STRING
    },

    message:{
        type:DataTypes.TEXT
    },

    roles:{
        type:DataTypes.JSON
    },

    totalRecipients:{
        type:DataTypes.INTEGER
    },

    successCount:{
        type:DataTypes.INTEGER,
        defaultValue:0
    },

    failedCount:{
        type:DataTypes.INTEGER,
        defaultValue:0
    },

    status:{
        type:DataTypes.STRING
    }

});

export default EmailNotification;