import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EventAttributes {
    id: number;
    userId: number;
    zoneId: number;
    type: string;
    description: string;
    metadata?: object;
    createdAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id' | 'metadata' | 'createdAt'> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
    public id!: number;
    public userId!: number;
    public zoneId!: number;
    public type!: string;
    public description!: string;
    public metadata?: object;
    public readonly createdAt!: Date;
}

Event.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
        },
        zoneId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'zone_id',
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'events',
        timestamps: true,
        updatedAt: false,
    }
);

export default Event;
