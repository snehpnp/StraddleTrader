import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface Instrument {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: string;
  instrumentType: string; // CE, PE, FUT
  lotSize: string;
  exchange: string;
}

class InstrumentService {
  private instruments: Instrument[] = [];
  private masterFilePath = path.join(process.cwd(), 'data', 'nfo_master.json');

  constructor() {
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'));
    }
  }

  async loadMaster() {
    try {
      console.log('🔄 Loading NFO Master...');
      // In a real app, you might download this daily
      // For now, let's try to download it if it doesn't exist
      if (!fs.existsSync(this.masterFilePath)) {
          await this.downloadMaster();
      }

      const raw = fs.readFileSync(this.masterFilePath, 'utf8');
      this.instruments = JSON.parse(raw);
      console.log(`✅ Loaded ${this.instruments.length} instruments`);
    } catch (err) {
      console.error('❌ Failed to load master:', err);
    }
  }

  async downloadMaster() {
    console.log('🌐 Downloading NFO Master from Stoxkart...');
    const url = 'https://stoxkart.com/Master_Scrip/NFO_Instruments.json';
    const res = await axios.get(url, { timeout: 60000 });
    fs.writeFileSync(this.masterFilePath, JSON.stringify(res.data));
    console.log('💾 Master downloaded and saved.');
  }

  findATMOptions(underlying: string, expiry: string, atmStrike: number) {
    const options = this.instruments.filter(i => 
      i.name === underlying && 
      i.expiry === expiry && 
      parseFloat(i.strike) === atmStrike &&
      (i.instrumentType === 'CE' || i.instrumentType === 'PE')
    );

    return {
      ce: options.find(o => o.instrumentType === 'CE'),
      pe: options.find(o => o.instrumentType === 'PE')
    };
  }

  getUniqueExpiries(underlying: string) {
    const list = this.instruments
      .filter(i => i.name === underlying && (i.instrumentType === 'CE' || i.instrumentType === 'PE'))
      .map(i => i.expiry);
    
    return [...new Set(list)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }
  
  getUnderlyingBySymbol(symbol: string) {
      // Small helper if NIFTY is passed as NIFTY 50 etc
      return symbol;
  }
}

export const instrumentService = new InstrumentService();
