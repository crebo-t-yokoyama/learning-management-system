import { NextResponse } from "next/server";
import { z } from "zod";
import type { ValidationErrorResponse, SuccessResponse, PaginationMeta } from "@/lib/validations";

/**
 * API エラーレスポンスの作成
 */
export function createErrorResponse(
	message: string, 
	status: number = 500, 
	details?: Record<string, string[]>
): NextResponse<ValidationErrorResponse> {
	const response: ValidationErrorResponse = {
		error: message,
		...(details && { details }),
	};
	
	return NextResponse.json(response, { status });
}

/**
 * API 成功レスポンスの作成
 */
export function createSuccessResponse<T>(
	data: T, 
	status: number = 200, 
	meta?: Partial<PaginationMeta>
): NextResponse<SuccessResponse<T>> {
	const response: SuccessResponse<T> = {
		success: true,
		data,
		...(meta && { meta }),
	};
	
	return NextResponse.json(response, { status });
}

/**
 * Zodバリデーションエラーのハンドリング
 */
export function handleValidationError(error: z.ZodError): NextResponse<ValidationErrorResponse> {
	return createErrorResponse(
		"入力値が正しくありません",
		400,
		error.flatten().fieldErrors
	);
}

/**
 * 一般的なエラーハンドリング
 */
export function handleGenericError(
	error: unknown,
	context: string = "操作"
): NextResponse<ValidationErrorResponse> {
	console.error(`${context}エラー:`, error);
	
	if (error instanceof z.ZodError) {
		return handleValidationError(error);
	}
	
	if (error instanceof Error) {
		// 既知のエラータイプの処理
		if (error.message.includes("PGRST116")) {
			return createErrorResponse("リソースが見つかりません", 404);
		}
		
		if (error.message.includes("duplicate key")) {
			return createErrorResponse("このデータは既に存在します", 409);
		}
		
		if (error.message.includes("foreign key")) {
			return createErrorResponse("関連するデータが見つかりません", 400);
		}
	}
	
	return createErrorResponse("内部サーバーエラー", 500);
}

/**
 * ページネーション情報の計算
 */
export function calculatePagination(
	total: number,
	page: number,
	limit: number
): PaginationMeta {
	const totalPages = Math.ceil(total / limit);
	
	return {
		total,
		page,
		limit,
		totalPages,
		hasNext: page < totalPages,
		hasPrev: page > 1,
	};
}

/**
 * クエリパラメータのパース
 */
export function parseQueryParams(url: string): Record<string, string> {
	const { searchParams } = new URL(url);
	return Object.fromEntries(searchParams.entries());
}

/**
 * 更新データのクリーンアップ（undefinedフィールドを除去）
 */
export function cleanUpdateData<T extends Record<string, unknown>>(data: T): Partial<T> {
	const cleaned: Partial<T> = {};
	
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) {
			cleaned[key as keyof T] = value as T[keyof T];
		}
	}
	
	return cleaned;
}

/**
 * 日付範囲のバリデーション
 */
export function validateDateRange(dateFrom?: string, dateTo?: string): {
	isValid: boolean;
	error?: string;
} {
	if (!dateFrom && !dateTo) {
		return { isValid: true };
	}
	
	if (dateFrom && dateTo) {
		const from = new Date(dateFrom);
		const to = new Date(dateTo);
		
		if (from > to) {
			return {
				isValid: false,
				error: "開始日は終了日より前である必要があります",
			};
		}
		
		// 1年を超える範囲は制限
		const oneYearMs = 365 * 24 * 60 * 60 * 1000;
		if (to.getTime() - from.getTime() > oneYearMs) {
			return {
				isValid: false,
				error: "日付範囲は1年以内で指定してください",
			};
		}
	}
	
	return { isValid: true };
}

/**
 * SQLインジェクション対策のためのクエリサニタイズ
 */
export function sanitizeSearchQuery(query: string): string {
	// 基本的なサニタイズ
	return query
		.replace(/[%_\\]/g, "\\$&") // LIKE句の特殊文字をエスケープ
		.replace(/[';--]/g, "") // SQLインジェクション対策
		.trim()
		.substring(0, 100); // 長さ制限
}

/**
 * CSVファイル名の生成
 */
export function generateCsvFilename(baseName: string, dateFrom?: string, dateTo?: string): string {
	const timestamp = new Date().toISOString().split('T')[0];
	const dateRange = dateFrom && dateTo ? `${dateFrom}-to-${dateTo}` : timestamp;
	return `${baseName}-${dateRange}.csv`;
}

/**
 * API レスポンスのキャッシュヘッダー設定
 */
export function setCacheHeaders(response: NextResponse, maxAge: number = 300): NextResponse {
	response.headers.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}`);
	response.headers.set("ETag", `"${Date.now()}"`);
	return response;
}

/**
 * CORS ヘッダーの設定
 */
export function setCorsHeaders(response: NextResponse): NextResponse {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
	return response;
}

/**
 * セキュリティヘッダーの設定
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	return response;
}