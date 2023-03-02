export async function ping() {
  return {body: JSON.stringify({status: 'ok'}), statusCode: 200};
}
