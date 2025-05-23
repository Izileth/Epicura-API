import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient{
    constructor(){
        super({
            datasources: {
                db: {
                    url: 'mongodb+srv://Epircura-Clould-User:vHYEvm8xyKp7q5WL@epicura-cluster.efbybqp.mongodb.net/epicura-db?retryWrites=true&w=majority&appName=Epicura-Cluster'
                }
            }
        })
    }
}
