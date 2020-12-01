import {Command, flags} from '@oclif/command'
import axios from 'axios'
import * as fs from 'fs'

const DEFAULT_URL = 'https://www.uniprot.org/uploadlists/'

const idMap = new Map()

class ConvertUniprotGmt extends Command {
  static description = 'describe the command here'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'input', description: 'input gmt file with uniprot ids'}, {name: 'output', description: 'output gmt file with gene symbols'}]

  async convertFile2(inputFile: string, outputFile: string) {
    const fileText = fs.readFileSync(inputFile, 'utf8')
    const ids = this.collectIds(fileText)
    await this.getIds(ids) // do a single large fetch
    const outputText = this.convertEntries2(fileText.split('\n'))
    // let outputText = ''
    // for (const line of fileText.split('\n')) {
    //   const entries = line.split('\t')
    //   outputText += entries[0]
    //   outputText += await this.convertEntries(entries.slice(1))
    // }
    fs.writeFileSync(outputFile, outputText)
  }

  // TODO: iterate therough the text and collect the ids
  collectIds(fileText: string): Array<string> {
    const outputs = []
    const lines = fileText.split('\n')
    for (const line of lines) {

    }

    return outputs
  }

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

  convertEntries2(entries: string[]): string {
    const formattedEntries = entries.map(e => {
      return e.replace('UniProtKB:', '')
    }).join(' ')
    return formattedEntries.split(' ').map(f => idMap.get(f)).join('\t')
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
    const {data} = await axios.get(url)
    this.addTsvToMap(data)
  }

  addTsvToMap(data: string) {
    for (const line of data.split('\n').slice(1).filter(f => f.trim().length > 0)) {
      const entries = line.split('\t')
      idMap.set(entries[0], entries[1])
    }
  }

  async run() {
    const {args} = this.parse(ConvertUniprotGmt)
    if (args.input && args.output) {
      if (fs.existsSync(args.input)) {
        if (fs.existsSync(args.output)) fs.unlinkSync(args.output) // delete output if exists
        // this.convertFile(args.input, args.output)
        this.convertFile2(args.input, args.output)
      }
    }
  }
}

export = ConvertUniprotGmt
