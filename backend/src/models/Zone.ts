import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface ZoneAttributes {
  id?: number;
  userId: number;
  name: string;
  type: 'Outdoor' | 'Indoor' | 'Greenhouse';
  sensors: object;
  status: object;
  config: object;
  createdAt?: Date;
  updatedAt?: Date;
}

class Zone extends Model<ZoneAttributes> implements ZoneAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public type!: 'Outdoor' | 'Indoor' | 'Greenhouse';
  public sensors!: object;
  public status!: object;
  public config!: object;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Zone.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Outdoor', 'Indoor', 'Greenhouse'),
      allowNull: false,
    },
    sensors: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'zones',
  }
);

export default Zone;
