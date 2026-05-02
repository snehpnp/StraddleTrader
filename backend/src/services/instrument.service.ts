import axios from 'axios';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

export const ALLOWED_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];

interface Instrument {
  token: string;
  symbol: string;
  symbol_description: string;
  expiry_date: string;
  strike_price: string;
  option_type: string; // CE, PE
  lot_size: string;
  exchange: string;
  instrument_type: string;
}

class InstrumentService {
  private instruments: Instrument[] = [];
  private masterFilePath = path.join(process.cwd(), 'data', 'nfo_master.json');

  constructor() {
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'));
    }
    this.setupCron();
  }

  private setupCron() {
    // Run at 07:00 AM every day
    cron.schedule('0 7 * * *', async () => {
      console.log('⏰ Cron: Starting daily instrument master update...');
      await this.downloadMaster();
      await this.loadMaster();
      console.log('✅ Cron: Daily instrument master update completed.');
    });
  }


  async loadMaster() {
    try {
      console.log('🔄 Loading NFO Master...');
      if (!fs.existsSync(this.masterFilePath) || fs.statSync(this.masterFilePath).size === 0) {
          await this.downloadMaster();
      }

      const raw = fs.readFileSync(this.masterFilePath, 'utf8');
      const json = JSON.parse(raw);
      
      let list = Array.isArray(json) ? json : (json.data || json.result || []);
      
      // Filter relevant symbols AND exclude expired instruments
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.instruments = list.filter((i: any) => {
        if (!i.symbol || !i.expiry_date) return false;
        
        const isAllowed = ALLOWED_SYMBOLS.includes(i.symbol.toUpperCase());
        if (!isAllowed) return false;

        // Date check: format DD-MM-YYYY
        const [d, m, y] = i.expiry_date.split('-').map(Number);
        const expiryDate = new Date(y, m - 1, d);
        
        return expiryDate >= today;
      });
      
      console.log(`✅ Loaded ${this.instruments.length} active instruments (${ALLOWED_SYMBOLS.join(', ')})`);
      if (this.instruments.length > 0) {
        console.log('📝 Sample Instrument:', this.instruments[0]);
      }
    } catch (err) {
      console.error('❌ Failed to load master:', err);
    }
  }

  async downloadMaster() {
    console.log('🌐 Downloading NFO Master from Stoxkart...');
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
      i.symbol === underlying && 
      i.expiry_date === expiry && 
      (parseInt(i.strike_price) / 100) === atmStrike &&
      (i.option_type === 'CE' || i.option_type === 'PE')
    );

    return {
      ce: options.find(o => o.option_type === 'CE'),
      pe: options.find(o => o.option_type === 'PE')
    };
  }

  getUniqueExpiries(underlying: string) {
    const searchName = underlying.toUpperCase();
    const filtered = this.instruments.filter(i => 
      i.symbol?.toUpperCase() === searchName && 
      (i.option_type === 'CE' || i.option_type === 'PE')
    );

    const list = filtered.map(i => i.expiry_date);
    return [...new Set(list)].sort((a, b) => {
      const [d1, m1, y1] = a.split('-').map(Number);
      const [d2, m2, y2] = b.split('-').map(Number);
      return new Date(y1, m1-1, d1).getTime() - new Date(y2, m2-1, d2).getTime();
    });
  }

  getLotSize(underlying: string) {
    const searchName = underlying.toUpperCase();
    const instrument = this.instruments.find(i => 
      i.symbol?.toUpperCase() === searchName && 
      (i.option_type === 'CE' || i.option_type === 'PE')
    );
    return instrument ? parseInt(instrument.lot_size, 10) : null;
  }
}

export const instrumentService = new InstrumentService();
