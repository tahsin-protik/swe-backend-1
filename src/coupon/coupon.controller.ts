

import { Body, Controller, Get, Post } from '@nestjs/common';
import { CouponServiceResponse, CouponService, RedeemCouponRequest } from './coupon.service';

@Controller()
export class CouponController {
  constructor(private readonly couponService: CouponService) { }

  @Post('coupon-redeem')
  async getCoupon(
    @Body() data: RedeemCouponRequest,
  ): Promise<object> {
    return this.couponService.redeemCoupon(data)
  }


}
