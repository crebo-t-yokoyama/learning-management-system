"use client";

import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
	children: React.ReactNode;
	cols?: {
		default?: number;
		sm?: number;
		md?: number;
		lg?: number;
		xl?: number;
	};
	gap?: number;
	className?: string;
}

export function ResponsiveGrid({
	children,
	cols = {
		default: 1,
		sm: 1,
		md: 2,
		lg: 3,
		xl: 4,
	},
	gap = 6,
	className,
}: ResponsiveGridProps) {
	const gridClasses = cn(
		"grid",
		{
			[`grid-cols-${cols.default}`]: cols.default,
			[`sm:grid-cols-${cols.sm}`]: cols.sm,
			[`md:grid-cols-${cols.md}`]: cols.md,
			[`lg:grid-cols-${cols.lg}`]: cols.lg,
			[`xl:grid-cols-${cols.xl}`]: cols.xl,
			[`gap-${gap}`]: gap,
		},
		className,
	);

	return <div className={gridClasses}>{children}</div>;
}

// プリセットグリッド
export const StatsGrid = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<ResponsiveGrid
		cols={{
			default: 1,
			sm: 2,
			lg: 4,
		}}
		gap={6}
		className={className}
	>
		{children}
	</ResponsiveGrid>
);

export const ProductGrid = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<ResponsiveGrid
		cols={{
			default: 1,
			md: 2,
			lg: 3,
			xl: 4,
		}}
		gap={6}
		className={className}
	>
		{children}
	</ResponsiveGrid>
);

export const FormGrid = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<ResponsiveGrid
		cols={{
			default: 1,
			md: 2,
		}}
		gap={6}
		className={className}
	>
		{children}
	</ResponsiveGrid>
);
