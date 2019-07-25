'use strict';

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        emailAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            unique:{
                args: true,
                msg: 'Email address already in use.'
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }, 
    });

    User.associate = (models) => {
        User.hasMany(models.Course,{
            as: 'userId',
            foreignKey: 'userId',
            sourceKey: 'id',
        });
        
    };

    return User;
};