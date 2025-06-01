import { Page } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  abstract url: string;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
  }
}