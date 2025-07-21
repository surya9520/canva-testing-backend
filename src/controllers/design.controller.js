import {
  createDesignOnCanva,
  startExportAndRedirect
} from '../services/canva.service.js';

 export const createDesign = async (ctx) => {
  await createDesignOnCanva(ctx);
};


 export const navReturnHandler = async (ctx) => {
  await startExportAndRedirect(ctx);
};
