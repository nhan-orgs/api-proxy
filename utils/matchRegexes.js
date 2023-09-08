function matchesAnyRegex(input, regexArray) {
  for (let i = 0; i < regexArray.length; i++) {
    if (regexArray[i].test(input)) {
      return true
    }
  }
  return false
}

module.exports = {
  matchesAnyRegex,
}
