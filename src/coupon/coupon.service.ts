import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  validate,
  validateOrReject,
  Contains,
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Coupon } from 'src/entities/Coupon';
import { Player } from 'src/entities/Player';
import { PlayerCoupon } from 'src/entities/PlayerCoupon';
import { Reward } from 'src/entities/Reward';
import { connectionSource } from 'src/typeorm';
import { Repository } from 'typeorm';

export interface CouponServiceResponse {
  playerId: number,
  rewardId: number
}

export class RedeemCouponRequest {

  @IsInt()
  playerId: number;

  @IsInt()
  rewardId: number;
}

@Injectable()
export class CouponService {

  constructor(@InjectRepository(Player) private playerRepository: Repository<Player>,
    @InjectRepository(Coupon) private couponRepository: Repository<Coupon>,
    @InjectRepository(Reward) private rewardRepository: Repository<Reward>,
    @InjectRepository(PlayerCoupon) private playerCouponRepository: Repository<PlayerCoupon>
  ) { }

  async redeemCoupon(data: RedeemCouponRequest): Promise<any> {
    try {

      const player = await this.playerRepository.createQueryBuilder("player")
        .where("player.id = :id", { id: data.playerId })
        .getOne()

      if (!player) throw new Error("User Doesn't Exist!")

      const currentDate = new Date().toISOString().slice(0, 10)

      const reward = await this.rewardRepository.createQueryBuilder("reward")
        .where("reward.id = :id", { id: data.rewardId })
        .andWhere("datediff(:currentDate, reward.startDate) >= 0", { currentDate })
        .andWhere("datediff(reward.endDate, :currentDate)>=0", { currentDate })
        .getOne()

      if (!reward) throw new Error("Reward Doesn't Exist Or Expired!")

      const alreadyRedeemed = await this.playerCouponRepository.createQueryBuilder("player_coupon")
        .leftJoinAndSelect('player_coupon.coupon', 'coupon')
        .where("playerId=:playerId and coupon.rewardId=:rewardId", { playerId: data.playerId, rewardId: data.rewardId })
        .getMany()


      if (alreadyRedeemed.length >= reward.totalLimit) throw new Error("Already Reached Total Limit!")

      const alreadyRedeemedToday = await this.playerCouponRepository.createQueryBuilder("player_coupon")
        .leftJoinAndSelect('player_coupon.coupon', 'coupon')
        .where("playerId=:playerId and coupon.rewardId=:rewardId and datediff(:currentDate, redeemedAt) = 0", { playerId: data.playerId, rewardId: data.rewardId, currentDate })
        .getMany()

      console.log(alreadyRedeemedToday)

      if (alreadyRedeemedToday.length >= reward.perDayLimit) throw new Error("Already Reached Daily Limit!")

      let usedCouponMap = {}

      for (let x of alreadyRedeemed) {
        console.log(x)
        usedCouponMap[x.coupon.id] = true
      }

      const allCoupon = await this.couponRepository.createQueryBuilder('coupon')
        .where('rewardId= :rewardId', { rewardId: data.rewardId })
        .getMany()

      let selectedCoupon = null

      for (let x of allCoupon) {
        if (!usedCouponMap[x.id]) {
          selectedCoupon = x
          break
        }
      }

      if (!selectedCoupon) throw new Error("No Coupon Left!")



      await this.playerCouponRepository.insert({
        player: player,
        coupon: selectedCoupon,
        redeemedAt: currentDate
      })


      return { id: selectedCoupon.id, value: selectedCoupon.value }
    }
    catch (err) {
      console.log(err)
      return {
        error: true,
        message: err.message
      }
    }

    return;
  }
}
