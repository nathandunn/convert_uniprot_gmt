import {Command, flags} from '@oclif/command'
import axios from 'axios'
import * as fs from 'fs'

const DEFAULT_URL = 'https://www.uniprot.org/uploadlists/'

const idMap = new Map()

class ConvertUniprotGmt extends Command {
  static description = 'describe the command here'

  static flags = {
  //   // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
  //   // flag with a value (-n, --name=VALUE)
  //   name: flags.string({char: 'n', description: 'name to print'}),
  //   // flag with no value (-f, --force)
  //   force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'input',description:'input gmt file with uniprot ids'}, {name: 'output',description: 'output gmt file with gene symbols'}]

  async convertFile(inputFile: string, outputFile: string) {
    const fileText = fs.readFileSync(inputFile, 'utf8')
    let outputText = ''
    for (const line of fileText.split('\n')) {
      const entries = line.split('\t')
      outputText += entries[0]
      outputText += await this.convertEntries(entries.slice(1))
    }
    fs.writeFileSync(outputFile, outputText)
  }

  async convertEntries(entries: string[]): Promise<string> {
    const formattedEntries = entries.map(e => {
      return e.replace('UniProtKB:', '')
    }).join(' ')
    await this.getIds(formattedEntries)
    return formattedEntries.split(' ').map(f => idMap.get(f)).join('\t')
  }

  async getIds(ids: string): Promise<any> {
    const url = `${DEFAULT_URL}?query=${ids}&from=ACC+ID&to=GENE+NAME&format=tab`
    // const {data} = await urllib.request(DEFAULT_URL, {data: DEFAULT_PARAMS,nestedQuerystring:true})
    // const {data} = await urllib.request(DEFAULT_URL, {data: DEFAULT_PARAMS,nestedQuerystring:true})
    console.log('input url', url)
    const {data} = await axios.get(url)
    this.log('data', data)
    this.log('data string', data.toString())
    this.addTsvToMap(data)
  }

  addTsvToMap(data: string) {
    console.log('data', data)
    for (const line of data.split('\n').slice(1).filter(f => f.trim().length > 0)) {
      console.log('line', line)
      const entries = line.split('\t')
      console.log('etnries', entries)
      idMap.set(entries[0], entries[1])
      // idMap[entries[0]] = entries[1]
    }
  }

  async run() {
    const {args, flags} = this.parse(ConvertUniprotGmt)
    // const data = await this.getIds('O43175 Q9UM73 P97793')
    // this.log(data)
    if (args.input && args.output) {
      if (fs.existsSync(args.input)) {
        if (fs.existsSync(args.output)) fs.unlinkSync(args.output) // delete output if exists
        this.convertFile(args.input, args.output)
      }
    }

    // const name = flags.name ?? 'world'
    // this.log(`hello ${name} from ./src/index.ts`)
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }
  }
}

export = ConvertUniprotGmt
