import { Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeorm from 'src/typeorm';
import { Player } from 'src/entities/Player';
import { Reward } from 'src/entities/Reward';
import { Coupon } from 'src/entities/Coupon';
import { PlayerCoupon } from 'src/entities/PlayerCoupon';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Reward, Coupon, PlayerCoupon])],
  controllers: [CouponController],
  providers: [CouponService],
})
export class CouponModule { }
