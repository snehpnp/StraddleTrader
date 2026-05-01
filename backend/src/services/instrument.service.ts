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
      // Check if file exists and is not empty
      if (!fs.existsSync(this.masterFilePath) || fs.statSync(this.masterFilePath).size === 0) {
          await this.downloadMaster();
      }

      const raw = fs.readFileSync(this.masterFilePath, 'utf8');
      const json = JSON.parse(raw);
      // Stoxkart API returns data inside a 'data' array
      this.instruments = Array.isArray(json) ? json : json.data || [];
      
      console.log(`✅ Loaded ${this.instruments.length} instruments`);
    } catch (err) {
      console.error('❌ Failed to load master:', err);
    }
  }

  async downloadMaster() {
    console.log('🌐 Downloading NFO Master from Stoxkart...');
    // Updated URL based on developers.stoxkart.com
    const url = 'https://openapi.stoxkart.com/scrip-master/nfo';
    try {
        const res = await axios.get(url, { timeout: 60000 });
        if (res.data) {
            fs.writeFileSync(this.masterFilePath, JSON.stringify(res.data));
            console.log('💾 Master downloaded and saved.');
        } else {
            throw new Error('Empty response from scrip-master');
        }
    } catch (err) {
        console.error('❌ Download failed:', err instanceof Error ? err.message : err);
    }
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
}

export const instrumentService = new InstrumentService();
