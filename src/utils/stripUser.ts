const stripUser = (text: string) => text.replace(/<@[^>]*>\s*/g, '')
export default stripUser
