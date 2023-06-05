import * as PIXI from 'pixi.js';

const perspectiveBackground = PIXI.Assets.load('/perspective_background.png');
const blobBackground = PIXI.Assets.load('/FluxBlob.png');

async function createPerspectiveBackground(graphic: PIXI.Graphics | null): Promise<PIXI.Sprite> {
  const backgroundImage = new PIXI.Sprite(await perspectiveBackground);

  if (!graphic) {
    return backgroundImage;
  }

  // Set the position and scale of the background image to fit inside the circle
  //backgroundImage.anchor.set(0.5);
  backgroundImage.position.set(-graphic.width / 2, -graphic.height / 2);
  backgroundImage.width = graphic.width;
  backgroundImage.height = graphic.height;
  backgroundImage.alpha = 0.8;
  backgroundImage.tint = 0x333333;

  return backgroundImage;
}

async function createBlobBackground(
  graphic: PIXI.Graphics | null,
  mask: PIXI.Graphics | null,
  tint: number
): Promise<PIXI.Sprite> {
  const backgroundImage = new PIXI.Sprite(await blobBackground);

  if (!graphic) {
    return backgroundImage;
  }

  // Set the position and scale of the background image to fit inside the circle
  //backgroundImage.anchor.set(0.5);
  backgroundImage.position.set(-graphic.width / 2, -graphic.height / 2);
  backgroundImage.width = graphic.width;
  backgroundImage.height = graphic.height;
  backgroundImage.alpha = 0.1;
  backgroundImage.tint = tint;
  backgroundImage.zIndex = 7;
  backgroundImage.mask = mask;

  return backgroundImage;
}

async function createBackgroundFromFileExpression(
  graphic: PIXI.Graphics | null,
  mask: PIXI.Graphics | null,
  fileExpression: any
): Promise<PIXI.Sprite | null> {
  if (typeof fileExpression.data == 'string') {
    fileExpression.data = JSON.parse(fileExpression.data);
  }
  if (!fileExpression || !fileExpression.data || !fileExpression.data.data_base64) {
    console.error('Got broken file expression for background image: ', fileExpression);
    return null;
  }

  return await createBackgroundFromBase64(graphic, mask, fileExpression.data.data_base64);
}

async function createBackgroundFromBase64(
  graphic: PIXI.Graphics | null,
  mask: PIXI.Graphics | null,
  data_base64: string
): Promise<PIXI.Sprite | null> {
  // Convert the base64 string to a blob
  const byteCharacters = atob(data_base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });

  // Create a URL for the blob
  const blobUrl = URL.createObjectURL(blob);

  // Create a texture from the URL
  const texture = PIXI.Texture.from(blobUrl);

  // Create a sprite using the texture
  const backgroundImage = new PIXI.Sprite(texture);

  if (!graphic) {
    return backgroundImage;
  }

  // Set the position and scale of the background image to fit inside the circle
  //backgroundImage.anchor.set(0.5);
  backgroundImage.position.set(-graphic.width / 2, -graphic.height / 2);
  backgroundImage.width = graphic.width;
  backgroundImage.height = graphic.height;
  backgroundImage.alpha = 1;
  backgroundImage.zIndex = -7;
  backgroundImage.mask = mask;

  return backgroundImage;
}

export {
  createPerspectiveBackground,
  createBlobBackground,
  createBackgroundFromFileExpression,
  createBackgroundFromBase64
};
