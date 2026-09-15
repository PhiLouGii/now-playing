const trackId = '4078366841'

async function main() {
  const response = await fetch(
    `https://api.deezer.com/track/${trackId}`,
  )

  const data = await response.json()

  console.log('\nRAW TRACK RESPONSE:\n')
  console.log(
    JSON.stringify(
      data,
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(
    'Release year test failed:',
    error,
  )

  process.exit(1)
})