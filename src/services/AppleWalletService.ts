import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from 'fs/promises';

interface DateDetails {
  id: string;
  venue: string;
  proposedTime: string;
  otherPerson: {
    firstName: string;
    age: number;
  };
}

export class AppleWalletService {
  private static instance: AppleWalletService;
  private certificatePath: string;
  private wwdrPath: string;
  private keyPath: string;
  private passTypeIdentifier: string;
  private teamIdentifier: string;

  private constructor() {
    // These would typically be environment variables
    this.certificatePath = process.env.APPLE_PASS_CERTIFICATE_PATH!;
    this.wwdrPath = process.env.APPLE_WWDR_PATH!;
    this.keyPath = process.env.APPLE_PASS_KEY_PATH!;
    this.passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER!;
    this.teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER!;
  }

  public static getInstance(): AppleWalletService {
    if (!AppleWalletService.instance) {
      AppleWalletService.instance = new AppleWalletService();
    }
    return AppleWalletService.instance;
  }

  public async generatePass(dateDetails: DateDetails): Promise<Buffer> {
    try {
      const pass = await PKPass.from({
        model: path.resolve('public/passes/date.pass'),
        certificates: {
          wwdr: await fs.readFile(this.wwdrPath),
          signerCert: await fs.readFile(this.certificatePath),
          signerKey: await fs.readFile(this.keyPath),
        }
      }, {
        serialNumber: dateDetails.id,
        description: `Date at ${dateDetails.venue}`,
        organizationName: 'Ophelia Dating',
        passTypeIdentifier: this.passTypeIdentifier,
        teamIdentifier: this.teamIdentifier,
        foregroundColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgb(186, 37, 37)',
        labelColor: 'rgb(255, 255, 255)',
        pass: {
          headerFields: [{
            key: 'venue',
            label: 'VENUE',
            value: dateDetails.venue
          }],
          primaryFields: [{
            key: 'date',
            label: 'DATE',
            value: new Date(dateDetails.proposedTime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })
          }],
          secondaryFields: [{
            key: 'time',
            label: 'TIME',
            value: new Date(dateDetails.proposedTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }, {
            key: 'person',
            label: 'DATE WITH',
            value: `${dateDetails.otherPerson.firstName}, ${dateDetails.otherPerson.age}`
          }],
          auxiliaryFields: [{
            key: 'ticketId',
            label: 'TICKET ID',
            value: dateDetails.id.slice(0, 8).toUpperCase()
          }],
          backFields: [{
            key: 'terms',
            label: 'Terms & Conditions',
            value: 'This ticket is non-transferable and non-refundable. Please arrive 10 minutes before your scheduled time.'
          }]
        }
      } as any);

      return pass.getAsBuffer();
    } catch (error) {
      console.error('Error generating Apple Wallet pass:', error);
      throw error;
    }
  }
} 