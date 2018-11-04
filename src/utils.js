import { ALLOWED_PARAMS_LENGTH, ALLOWED_FILE_EXTENSIONS } from './constants'

const getExtension = file => file.split('.').pop()

export const validateParserParams = files =>
  files.length === ALLOWED_PARAMS_LENGTH &&
  ALLOWED_FILE_EXTENSIONS.includes(getExtension(files[1])) &&
  ALLOWED_FILE_EXTENSIONS.includes(getExtension(files[2]))
