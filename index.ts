import { execFile } from 'child_process'
import { globSync } from 'glob'
import { dirname, basename } from 'path'
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { ArgumentsCamelCase } from 'yargs'
import { rm } from 'fs/promises'

const GLOB_PATTERN = '**/*.flac'

const convert = async (input: string) => {
  const dir = dirname(input)
  const filename = basename(input, '.flac')

  new Promise<void>((resolve, reject) =>
    execFile(
      'ffmpeg',
      [
        '-i', input,
        '-ab', '320k',
        '-map_metadata', '0',
        '-id3v2_version', '3',
        `${dir}/${filename}.mp3`
      ],
      (error, stdout, stderr) => {
        if (error) {
          console.error(stderr)
          reject(error)
        } else {
          console.log(stdout)
          rm(input).then(resolve).catch(reject)
        }
      }
    )
  )
}

const commands = {
  convert: async (argv: ArgumentsCamelCase<{ glob: string }>) => {
    const { glob: pattern } = argv
    const files = globSync(pattern)

    let queue = Promise.resolve()
    const chunkSize = 20
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize)
      queue = queue.then(async () => { await Promise.all(chunk.map(convert)) })
    }

    await queue
  }
}

const main = () => {
  yargs(hideBin(process.argv))
    .scriptName('ffmpeg2mp3')
    .command(
      'convert [glob]',
      'convert all selected files to mp3',
      (yargs) => yargs.positional('glob', {
        describe: 'glob pattern to match files',
        default: GLOB_PATTERN
      }),
      (argv) => {
        commands.convert(argv).catch(console.error)
      }
    )
    .demandCommand()
    .help()
    .parse()
}

main()
