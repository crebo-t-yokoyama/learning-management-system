import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorDisplay } from "@/components/ui/error-display";

describe("ErrorDisplay", () => {
	it("デフォルトのカード形式でレンダリングされる", () => {
		render(<ErrorDisplay message="詳細なエラーメッセージ" />);

		// デフォルトタイトルとメッセージを確認（異なるテキストを使用）
		expect(
			screen.getByRole("heading", { name: "エラーが発生しました" }),
		).toBeInTheDocument();
		expect(screen.getByText("詳細なエラーメッセージ")).toBeInTheDocument();
	});

	it("カスタムタイトルが表示される", () => {
		render(
			<ErrorDisplay title="カスタムエラー" message="詳細なエラーメッセージ" />,
		);

		expect(
			screen.getByRole("heading", { name: "カスタムエラー" }),
		).toBeInTheDocument();
		expect(screen.getByText("詳細なエラーメッセージ")).toBeInTheDocument();
	});

	it("再試行ボタンがクリックされたときにコールバックが呼ばれる", () => {
		const mockRetry = vi.fn();
		render(<ErrorDisplay message="エラーが発生しました" onRetry={mockRetry} />);

		const retryButton = screen.getByRole("button", { name: "再試行" });
		fireEvent.click(retryButton);

		expect(mockRetry).toHaveBeenCalledOnce();
	});

	it("戻るボタンがクリックされたときにコールバックが呼ばれる", () => {
		const mockBack = vi.fn();
		render(
			<ErrorDisplay
				message="エラーが発生しました"
				showBack={true}
				onBack={mockBack}
			/>,
		);

		const backButton = screen.getByRole("button", { name: "戻る" });
		fireEvent.click(backButton);

		expect(mockBack).toHaveBeenCalledOnce();
	});

	it("alert バリアントで正しくレンダリングされる", () => {
		render(<ErrorDisplay variant="alert" message="アラートエラー" />);

		expect(screen.getByText("アラートエラー")).toBeInTheDocument();
		// Alert コンポーネントの確認
		expect(document.querySelector('[role="alert"]')).toBeInTheDocument();
	});

	it("page バリアントで正しくレンダリングされる", () => {
		render(<ErrorDisplay variant="page" message="ページエラー" />);

		expect(screen.getByText("ページエラー")).toBeInTheDocument();
	});

	it("詳細情報が表示される", () => {
		render(
			<ErrorDisplay message="エラーメッセージ" details="詳細なエラー情報" />,
		);

		expect(screen.getByText("エラーメッセージ")).toBeInTheDocument();
		expect(screen.getByText("詳細なエラー情報")).toBeInTheDocument();
	});

	it("カスタムクラス名が適用される", () => {
		const { container } = render(
			<ErrorDisplay message="エラー" className="custom-error-class" />,
		);

		// Card コンポーネントにクラスが適用されることを確認
		expect(container.querySelector(".custom-error-class")).toBeInTheDocument();
	});

	it("再試行ボタンを非表示にできる", () => {
		render(<ErrorDisplay message="エラーが発生しました" showRetry={false} />);

		expect(
			screen.queryByRole("button", { name: "再試行" }),
		).not.toBeInTheDocument();
	});

	it("アイコンが表示される", () => {
		render(<ErrorDisplay message="エラーメッセージ" />);

		// AlertCircle アイコンの存在を確認（svg要素として）
		const alertIcon = document.querySelector("svg");
		expect(alertIcon).toBeInTheDocument();
	});
});
