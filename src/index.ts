import {Command, flags} from '@oclif/command'
import axios from 'axios'
// const urllib = require('urllib')

const DEFAULT_URL = 'https://www.uniprot.org/uploadlists/'

const DEFAULT_PARAMS = {
  from: 'ACC+ID',
  to: 'GENE+NAME',
  format: 'tab',
  query: 'P40925 P40926 O43175 Q9UM73 P97793',
}

class ConvertUniprotGmt extends Command {
  static description = 'describe the command here'

  async getIds(ids: string): Promise<any> {
    const url = `${DEFAULT_URL}?query=${ids}&from=ACC+ID&to=GENE+NAME&format=tab`
    // const {data} = await urllib.request(DEFAULT_URL, {data: DEFAULT_PARAMS,nestedQuerystring:true})
    // const {data} = await urllib.request(DEFAULT_URL, {data: DEFAULT_PARAMS,nestedQuerystring:true})
    console.log('input url', url)
    const {data} = await axios.get(url)
    this.log('data', data)
    this.log('data string', data.toString())
    return data
  }

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(ConvertUniprotGmt)

    const data = await this.getIds('O43175 Q9UM73 P97793')
    this.log(data)

    // const name = flags.name ?? 'world'
    // this.log(`hello ${name} from ./src/index.ts`)
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }
  }
}

export = ConvertUniprotGmt
