export default function iconComponentName(languageAddress: string): string {
    const onlyLetters = languageAddress
        .split('')
        .filter(letter => { return /[a-z]|[A-Z]/.test(letter)})
        .join('')
    const short = onlyLetters.substr(onlyLetters.length-10, 10).toLowerCase()

    console.debug(languageAddress, '->', onlyLetters, '->', short)
    return 'icon-'+short
}
