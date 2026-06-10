import herokuEslintConfig from '@heroku-cli/test-utils/eslint-config'
import vitestOverlay from '@heroku-cli/test-utils/eslint-config/vitest'

export default [...herokuEslintConfig, ...vitestOverlay]
