//const { error } = require('../../config')
import { error } from '../../config';

export const downloadIcsFile = async (name: string, uri: string): Promise<string | null> => {
  try {
    const response = await fetch(uri, {
      method: "GET"
    });
    
    if (!response.ok) {
      const responseData = await response.json();
      error(`Failed to download '${name}' from '${uri}':`, JSON.stringify(responseData));

      return null;
    }
    
    return await response.text();
  } catch (ex) {
    error(`Failed to download '${name}' from '${uri}':`, ex);
    return null;
  }
}