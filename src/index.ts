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
    console.log('collecting all ids')
    const ids = this.collectIds(fileText)
    const CHUNK_SIZE = 300
    const promises = []
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      promises.push(this.getIds(ids.slice(i, i + CHUNK_SIZE).join(' ')))
    }
    await Promise.all(promises)
    console.log('output ids', idMap.size)
    const outputText = this.convertEntries2(fileText.split('\n').filter(f => f.trim().length > 0))
    fs.writeFileSync(outputFile, outputText)
  }

  // TODO: iterate through the text and collect the ids
  collectIds(fileText: string): Array<string> {
    let outputs = new Array<string>()
    const lines = fileText.split('\n')
    for (const line of lines) {
      const entries = line.split('\t').slice(1)
      const formattedLine = entries.map(e => e.replace('UniProtKB:', ''))
      if (formattedLine.length > 0) {
        outputs = outputs.concat(...formattedLine)
      }
    }
    return [...new Set(outputs)]
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
      return e.replace(/UniProtKB:/g, '')
    })
    const exportData = formattedEntries.map(f => {
      const lineEntries = f.split('\t')
      const outputLine = lineEntries[0] + '\t' + lineEntries.slice(1).map(l => idMap.get(l)).join('\t')
      return outputLine
    }).join('\n')
    return exportData
  }

  async convertEntries(entries: string[]): Promise<string> {
    const formattedEntries = entries.map(e => {
      return e.replace('UniProtKB:', '')
    }).join(' ')
    const CHUNK_SIZE = 500
    const promises = []
    for (let i = 0; i < formattedEntries.length; i += CHUNK_SIZE) {
      promises.push(this.getIds(formattedEntries.slice(i, i + CHUNK_SIZE)))
    }
    await Promise.all(promises)
    return formattedEntries.split(' ').map(f => idMap.get(f)).join('\t')
  }

  async getIds(ids: string): Promise<any> {
    const url = `${DEFAULT_URL}?query=${ids}&from=ACC+ID&to=GENE+NAME&format=tab`
    try {
      const {data} = await axios.get(url)
      this.addTsvToMap(data)
    } catch (e) {
      console.error(e)
    }
  }

  addTsvToMap(data: string) {
    for (const line of data.split('\n').slice(1).filter(f => f.trim().length > 0)) {
      const entries = line.split('\t')
      idMap.set(entries[0], entries[1])
    }
  }

  async run() {
    const {args} = this.parse(ConvertUniprotGmt)
    if (args.input) {
      if (fs.existsSync(args.input)) {
        const output = args.output ? args.output : `${args.input}_converted.gmt`
        console.log('converted ids from ', args.input, output)
        if (fs.existsSync(output)) fs.unlinkSync(output) // delete output if exists
        // this.convertFile(args.input, args.output)
        this.convertFile2(args.input, output)
      }
    }
  }
}

export = ConvertUniprotGmt
