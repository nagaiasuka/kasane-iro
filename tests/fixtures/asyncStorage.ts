const values = new Map<string, string>();
export const control = { delayNextWrite: 0, failNextWrite: false };
export default {
  async getItem(key: string) { return values.get(key) ?? null; },
  async setItem(key: string, value: string) {
    const delay = control.delayNextWrite;
    control.delayNextWrite = 0;
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (control.failNextWrite) { control.failNextWrite = false; throw new Error('Storage unavailable'); }
    values.set(key, value);
  },
  async removeItem(key: string) { values.delete(key); },
};
