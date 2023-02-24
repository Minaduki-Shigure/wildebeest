export function getRandomNumString(length = 5) {
	if (length <= 0 || length > 15) throw new Error('invalid length provided to getRandomNumString')
	const max = 10 ** length - 1
	const randomNumber = Math.round(Math.random() * max)
	return `${randomNumber}`.padStart(length, '0')
}
