import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			include: ["src/**/__tests__/**/*.test.ts"],
			passWithNoTests: true,
			coverage: {
				include: ["src/**/*.ts"],
				exclude: ["src/test/**", "src/**/__tests__/**"],
				reporter: ["text", "html", "lcov"],
			},
		},
	}),
);
