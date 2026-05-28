/**
 * autarq-hub Connector Interfaces
 *
 * Every connector implements one of these interfaces.
 * Business logic depends ONLY on these interfaces — never on concrete implementations.
 * Every connector must also provide a mock implementation (mock.ts) for tests.
 */

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface ConnectorConfig {
  id: string
  provider: string
  keyVersion: number
}

export type SyncInterval = 'realtime' | 'on-demand' | number // number = minutes

// ─── Email ───────────────────────────────────────────────────────────────────

export interface Folder {
  id: string
  name: string
  path: string
}

export interface MessageSummary {
  id: string
  externalId: string
  subject: string
  from: string
  to: string[]
  date: Date
  hasAttachments: boolean
  folderId: string
}

export interface Message extends MessageSummary {
  body: string
  bodyType: 'html' | 'text'
  attachments: Attachment[]
}

export interface Attachment {
  id: string
  filename: string
  mimeType: string
  size: number
}

export interface Draft {
  to: string[]
  cc?: string[]
  subject: string
  body: string
  bodyType: 'html' | 'text'
  attachments?: { filename: string; content: Buffer; mimeType: string }[]
}

export interface ListOptions {
  limit?: number
  offset?: number
  since?: Date
}

export interface IEmailConnector {
  listFolders(): Promise<Folder[]>
  listMessages(folderId: string, options?: ListOptions): Promise<MessageSummary[]>
  getMessage(id: string): Promise<Message>
  sendMessage(draft: Draft): Promise<void>
  moveMessage(id: string, targetFolderId: string): Promise<void>
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  externalId: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  description?: string
  location?: string
  attendees?: string[]
  conflict?: boolean
}

export interface ICalendarConnector {
  listEvents(from: Date, to: Date): Promise<CalendarEvent[]>
  createEvent(event: Omit<CalendarEvent, 'id' | 'externalId' | 'conflict'>): Promise<CalendarEvent>
  updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent>
  deleteEvent(id: string): Promise<void>
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export interface Contact {
  id: string
  externalId: string
  firstName?: string
  lastName?: string
  emails: string[]
  phones?: string[]
  organization?: string
}

export interface IContactsConnector {
  listContacts(options?: ListOptions): Promise<Contact[]>
  getContact(id: string): Promise<Contact>
  createContact(contact: Omit<Contact, 'id' | 'externalId'>): Promise<Contact>
  updateContact(id: string, patch: Partial<Contact>): Promise<Contact>
  deleteContact(id: string): Promise<void>
}

// ─── Banking ─────────────────────────────────────────────────────────────────

export interface BankTransaction {
  id: string
  externalId: string
  date: Date
  amount: number       // in cents, negative = debit
  currency: string
  description: string
  creditorName?: string
  debtorName?: string
  iban?: string
}

export interface BankAccount {
  id: string
  externalId: string
  iban: string
  name: string
  balance: number     // in cents
  currency: string
}

/** Banking connectors are READ-ONLY — no write operations */
export interface IBankingConnector {
  listAccounts(): Promise<BankAccount[]>
  listTransactions(accountId: string, from: Date, to: Date): Promise<BankTransaction[]>
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface StorageFile {
  id: string
  externalId: string
  name: string
  path: string
  mimeType: string
  size: number
  createdAt: Date
  modifiedAt: Date
}

export interface IStorageConnector {
  listFiles(path: string): Promise<StorageFile[]>
  getFile(id: string): Promise<{ file: StorageFile; content: Buffer }>
  uploadFile(path: string, filename: string, content: Buffer, mimeType: string): Promise<StorageFile>
  deleteFile(id: string): Promise<void>
}

// ─── Invoice Archive ──────────────────────────────────────────────────────────

export interface ArchivedInvoice {
  id: string
  externalId: string
  filename: string
  date: Date
  amount?: number
  currency?: string
  vendor?: string
}

export interface IInvoiceArchiveConnector {
  listInvoices(options?: ListOptions): Promise<ArchivedInvoice[]>
  getInvoice(id: string): Promise<{ invoice: ArchivedInvoice; content: Buffer }>
  pushInvoice(filename: string, content: Buffer, mimeType: string): Promise<ArchivedInvoice>
}
