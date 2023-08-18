module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	transform: {
		'^.+\\.ts?$': 'ts-jest',
	},
	setupFiles: ['<rootDir>/src/__tests__/jest.setup.js'],
	testRegex: '/__tests__/.*\\.(test|spec)?\\.ts$',
	moduleFileExtensions: ['js', 'json', 'ts'],
	collectCoverage: true,
	coverageDirectory: 'coverage',
	coveragePathIgnorePatterns: ['/node_modules/'],
	coverageReporters: ['text', 'lcov', 'clover'],
};
