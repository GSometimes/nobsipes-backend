import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';

dotenv.config();

const app: Express = express();
app.use(cors());

const PORT = process.env.PORT;

type Recipe = {
  name: string;
  image: string;
  ingredients: string[];
  directions: Record<string, string>;
};

async function getIngredients(url: string): Promise<Recipe> {
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const recipe: Recipe = {
      name: url.split('/').slice(-2, -1)[0].replace(/-/g, ' '),
      image: '',
      ingredients: [],
      directions: {},
    };

    recipe.image = $('.universal-image__image').data('src') as string;

    $('.mntl-structured-ingredients__list-item').each(
      (i: number, el: cheerio.Element) => {
        recipe.ingredients.push($(el).text().trim());
      }
    );

    $('.comp .mntl-sc-block .mntl-sc-block-html').each(
      (i: number, el: cheerio.Element) => {
        recipe.directions[`Step ${i + 1}`] = $(el).text().trim();
      }
    );

    return recipe;
  } catch (error) {
    console.error('Error scraping recipe:', error);
    throw error;
  }
}

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.get('/scrape', async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing URL query parameter' });
  }

  try {
    const recipe = await getIngredients(url);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape recipe' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
