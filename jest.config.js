module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  setupFilesAfterEnv: ['<rootDir>/__test__/setup.ts'],
  collectCoverage: true,
  coverageDirectory: '../coverage/'
}
