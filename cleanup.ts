import { execFile } from 'child_process'
import { globSync } from 'glob'

const remove = async (input: string) => {
  new Promise<void>((resolve, reject) =>
    execFile(
      'rm',
      [
        input
      ],
      (error, stdout, stderr) => {
        if (error) {
          console.error(stderr)
          reject(error)
        } else {
          console.log(stdout)
          resolve()
        }
      }
    )
  )
}

const main = async () => {
  const pattern = "**/*.flac"
  const files = globSync(pattern)

  let queue = Promise.resolve()
  const chunkSize = 20;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    queue = queue.then(async () => { await Promise.all(chunk.map(remove)) })
  }

  await queue
}

main().catch(console.error)
