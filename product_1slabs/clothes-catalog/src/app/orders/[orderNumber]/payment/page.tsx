import React from "react";
import { INITIAL_DATABASE } from "@/data/seed";
import OrderPaymentClient from "./OrderPaymentClient";

export function generateStaticParams() {
  return INITIAL_DATABASE.orders.map((o) => ({
    orderNumber: o.orderNumber,
  }));
}

export default function OrderPaymentPage() {
  return <OrderPaymentClient />;
}
