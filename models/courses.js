'use strict';

module.exports = (sequelize, DataTypes) => {
    const Course = sequelize.define('Course', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: -1
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        estimatedTime: {
            type: DataTypes.STRING,
        },
        materialsNeeded: {
            type: DataTypes.STRING,
        }
    });

    Course.associate = (models) => {
        Course.belongsTo(models.User);
    };

    return Course;
};
