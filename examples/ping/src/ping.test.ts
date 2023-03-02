import {env} from '@code-like-a-carpenter/env';

describe('ping', () => {
  it('response successfully', async () => {
    let result;
    try {
      const url = `${env('API_URL')}api/v1/ping`;

      result = await fetch(url);
    } catch (err) {
      console.log(err);
      throw err;
    }
    try {
      expect(result.status).toEqual(200);
      expect(await result.json()).toMatchInlineSnapshot(`
        {
          "status": "ok",
        }
      `);
    } catch (err) {
      console.log(await result.text());
      throw err;
    }
  });
});
