import {
  BillingChartResponse,
  CommonResponse,
  ErrorChartResponse,
  InfoResponse,
  InvitationGenerateResponse,
  InvitationResponse,
  ModelChartResponse,
  RedeemResponse,
  RequestChartResponse,
  UserResponse,
  UserTypeChartResponse,
} from "@/admin/types.ts";
import axios from "axios";
import { getErrorMessage } from "@/utils/base.ts";

export async function getAdminInfo(): Promise<InfoResponse> {
  try {
    const response = await axios.get("/admin/analytics/info");
    return response.data as InfoResponse;
  } catch (e) {
    console.warn(e);
    return { subscription_count: 0, billing_today: 0, billing_month: 0 };
  }
}

export async function getModelChart(): Promise<ModelChartResponse> {
  try {
    const response = await axios.get("/admin/analytics/model");
    const data = response.data as ModelChartResponse;

    return {
      date: data.date,
      value: data.value || [],
    };
  } catch (e) {
    console.warn(e);
    return { date: [], value: [] };
  }
}

export async function getRequestChart(): Promise<RequestChartResponse> {
  try {
    const response = await axios.get("/admin/analytics/request");
    return response.data as RequestChartResponse;
  } catch (e) {
    console.warn(e);
    return { date: [], value: [] };
  }
}

export async function getBillingChart(): Promise<BillingChartResponse> {
  try {
    const response = await axios.get("/admin/analytics/billing");
    return response.data as BillingChartResponse;
  } catch (e) {
    console.warn(e);
    return { date: [], value: [] };
  }
}

export async function getErrorChart(): Promise<ErrorChartResponse> {
  try {
    const response = await axios.get("/admin/analytics/error");
    return response.data as ErrorChartResponse;
  } catch (e) {
    console.warn(e);
    return { date: [], value: [] };
  }
}

export async function getUserTypeChart(): Promise<UserTypeChartResponse> {
  try {
    const response = await axios.get("/admin/analytics/user");
    return response.data as UserTypeChartResponse;
  } catch (e) {
    console.warn(e);
    return {
      total: 0,
      normal: 0,
      api_paid: 0,
      basic_plan: 0,
      standard_plan: 0,
      pro_plan: 0,
    };
  }
}

export async function getInvitationList(
  page: number,
): Promise<InvitationResponse> {
  try {
    const response = await axios.get(`/admin/invitation/list?page=${page}`);
    return response.data as InvitationResponse;
  } catch (e) {
    return {
      status: false,
      message: getErrorMessage(e),
      data: [],
      total: 0,
    };
  }
}

export async function generateInvitation(
  type: string,
  quota: number,
  number: number,
): Promise<InvitationGenerateResponse> {
  try {
    const response = await axios.post("/admin/invitation/generate", {
      type,
      quota,
      number,
    });
    return response.data as InvitationGenerateResponse;
  } catch (e) {
    return { status: false, data: [], message: getErrorMessage(e) };
  }
}

export async function getRedeemList(): Promise<RedeemResponse> {
  try {
    const response = await axios.get("/admin/redeem/list");
    return response.data as RedeemResponse;
  } catch (e) {
    console.warn(e);
    return [];
  }
}

export async function generateRedeem(
  quota: number,
  number: number,
): Promise<InvitationGenerateResponse> {
  try {
    const response = await axios.post("/admin/redeem/generate", {
      quota,
      number,
    });
    return response.data as InvitationGenerateResponse;
  } catch (e) {
    return { status: false, data: [], message: getErrorMessage(e) };
  }
}

export async function getUserList(
  page: number,
  search: string,
): Promise<UserResponse> {
  try {
    const response = await axios.get(
      `/admin/user/list?page=${page}&search=${search}`,
    );
    return response.data as UserResponse;
  } catch (e) {
    return {
      status: false,
      message: getErrorMessage(e),
      data: [],
      total: 0,
    };
  }
}

export async function quotaOperation(
  id: number,
  quota: number,
): Promise<CommonResponse> {
  try {
    const response = await axios.post("/admin/user/quota", { id, quota });
    return response.data as CommonResponse;
  } catch (e) {
    return { status: false, message: getErrorMessage(e) };
  }
}

export async function subscriptionOperation(
  id: number,
  month: number,
): Promise<CommonResponse> {
  try {
    const response = await axios.post("/admin/user/subscription", {
      id,
      month,
    });
    return response.data as CommonResponse;
  } catch (e) {
    return { status: false, message: getErrorMessage(e) };
  }
}
