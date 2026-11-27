import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { readCsv, updateCsv } from '../csvFile'

const permissionTest =
  process.platform === 'win32' || process.getuid?.() === 0 ? it.skip : it

describe('CSV real files', () => {
  let dir: string
  let file: string
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sasjs-csv-'))
    file = path.join(dir, 'report.csv')
  })
  afterEach(async () => fs.rm(dir, { recursive: true, force: true }))

  it('reads header-inclusive rows and preserves quoted data across updates', async () => {
    const cols = ['id', 'value']
    await updateCsv(file, ['a,"b"\nline'], [...cols], 'id')
    await updateCsv(file, ['x,y'], [...cols], 'id')
    await updateCsv(file, ['last'], [...cols], 'id')
    expect(await readCsv(file)).toEqual([
      ['id', 'value'],
      ['1', 'a,"b"\nline'],
      ['2', 'x,y'],
      ['3', 'last']
    ])
    expect(await fs.readFile(file, 'utf8')).toBe(
      'id,value\n1,"a,""b""\nline"\n2,"x,y"\n3,last'
    )
  })

  it('preserves records whose fields are empty on update', async () => {
    await fs.writeFile(file, 'id,value\n,\n1,existing')
    await updateCsv(file, ['next'], ['id', 'value'], 'id')
    expect(await readCsv(file)).toEqual([
      ['id', 'value'],
      ['', ''],
      ['1', 'existing'],
      ['3', 'next']
    ])
  })

  it.each(['id,value\n1,"unterminated', 'id,value\n1,ok,extra'])(
    'rejects invalid existing content without changing its bytes',
    async (content) => {
      await fs.writeFile(file, content)
      await expect(
        updateCsv(file, ['next'], ['id', 'value'], 'id')
      ).rejects.toThrow()
      expect(await fs.readFile(file, 'utf8')).toBe(content)
    }
  )

  it('propagates non-ENOENT read errors instead of writing', async () => {
    await fs.mkdir(file)
    await expect(
      updateCsv(file, ['next'], ['id', 'value'], 'id')
    ).rejects.toMatchObject({ code: 'EISDIR' })
  })

  permissionTest(
    'preserves a read-only file when the write is denied',
    async () => {
      const content = 'id,value\n1,existing'
      await fs.writeFile(file, content, { mode: 0o400 })
      await expect(
        updateCsv(file, ['next'], ['id', 'value'], 'id')
      ).rejects.toMatchObject({ code: 'EACCES' })
      expect(await fs.readFile(file, 'utf8')).toBe(content)
    }
  )

  permissionTest(
    'does not overwrite a writable file that cannot be read',
    async () => {
      const content = 'id,value\n1,existing'
      await fs.writeFile(file, content, { mode: 0o200 })
      try {
        await expect(
          updateCsv(file, ['next'], ['id', 'value'], 'id')
        ).rejects.toMatchObject({ code: 'EACCES' })
      } finally {
        await fs.chmod(file, 0o600)
      }
      expect(await fs.readFile(file, 'utf8')).toBe(content)
    }
  )

  it('retains the existing inode when writing a report', async () => {
    await fs.writeFile(file, 'id,value\n1,existing')
    const before = await fs.stat(file)
    const hardlink = path.join(dir, 'link.csv')
    await fs.link(file, hardlink)
    await updateCsv(file, ['next'], ['id', 'value'], 'id')
    expect((await fs.stat(file)).ino).toBe(before.ino)
    expect(await fs.readFile(hardlink, 'utf8')).toBe(
      await fs.readFile(file, 'utf8')
    )
  })

  it('creates a report and missing parent directories on ENOENT', async () => {
    const nested = path.join(dir, 'missing', 'report.csv')
    await updateCsv(nested, ['value'], ['id', 'value'], 'id')
    expect(await readCsv(nested)).toEqual([
      ['id', 'value'],
      ['1', 'value']
    ])
  })
})
