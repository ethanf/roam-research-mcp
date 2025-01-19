#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { DefaultApi } from './generated/api.js';
import { Configuration } from './generated/configuration.js';
import { inspect } from 'util';

interface ApiResponse {
  data: unknown;
}

interface ErrorResponse {
  response?: {
    data?: unknown;
    message?: string;
  };
  message?: string;
}

const BASE_PATH = 'http://localhost:3000';

const config = new Configuration({ basePath: BASE_PATH });
const api = new DefaultApi(config);

program
  .name('roam-cli')
  .description('CLI to interact with Roam Research')
  .version('0.1.0');

// Add debug logging for API calls
console.log(chalk.gray(`\nConnecting to API at ${BASE_PATH}...`));

// Add todo command
program
  .command('add-todo')
  .description('Add todo items to today\'s daily page')
  .argument('<items...>', 'Todo items to add')
  .action(async (items) => {
    try {
      console.log(`Adding todos: ${items}`);
      const response = await api.toolsroamAddTodoPost({ todos: items }) as ApiResponse;
      console.log(chalk.green('\nTodos added:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Create block command
program
  .command('create-block')
  .description('Add a new block to a page')
  .argument('<content>', 'Content of the block')
  .option('-p, --page <page>', 'Page title or UID')
  .action(async (content, options) => {
    try {
      const response = await api.toolsroamCreateBlockPost({
        content,
        page_uid: options.page,
        title: options.page
      }) as ApiResponse;
      console.log(chalk.green('\nBlock created:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Create page command
program
  .command('create-page')
  .description('Create a new page')
  .argument('<title>', 'Page title')
  .option('-c, --content <content>', 'Initial page content')
  .action(async (title, options) => {
    try {
      const response = await api.toolsroamCreatePagePost({
        title,
        content: options.content
      }) as ApiResponse;
      console.log(chalk.green('\nPage created:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Search by text command
program
  .command('search')
  .description('Search for blocks containing specific text')
  .argument('<text>', 'Text to search for')
  .option('-p, --page <page>', 'Page title or UID to search within')
  .action(async (text, options) => {
    try {
      const response = await api.toolsroamSearchByTextPost({
        text,
        page_title_uid: options.page
      }) as ApiResponse;
      console.log(chalk.green('\nSearch results:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Content Creation Commands
program
  .command('create-outline')
  .description('Add a structured outline to a page or block')
  .argument('<items...>', 'Outline items in format "text:level" (e.g., "Item 1:1" "Sub-item:2")')
  .option('-p, --page <page>', 'Page title or UID')
  .option('-b, --block <block>', 'Parent block text or UID')
  .action(async (items, options) => {
    try {
      const outline = items.map((item: string) => {
        const [text, level] = item.split(':');
        return { text, level: parseInt(level) || 1 };
      });
      
      const response = await api.toolsroamCreateOutlinePost({
        page_title_uid: options.page,
        block_text_uid: options.block,
        outline
      }) as ApiResponse;
      console.log(chalk.green('\nOutline created:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('import-markdown')
  .description('Import nested markdown content')
  .argument('<content>', 'Markdown content to import')
  .option('-p, --page <page>', 'Page title or UID')
  .option('-b, --block <block>', 'Parent block UID')
  .option('-s, --string <string>', 'Parent block string content')
  .option('-o, --order <order>', 'Where to add content (first/last)', 'last')
  .action(async (content, options) => {
    try {
      const response = await api.toolsroamImportMarkdownPost({
        content,
        page_uid: options.page,
        page_title: options.page,
        parent_uid: options.block,
        parent_string: options.string,
        order: options.order as 'first' | 'last'
      }) as ApiResponse;
      console.log(chalk.green('\nMarkdown imported:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Memory Commands
program
  .command('remember')
  .description('Store a memory with optional categories')
  .argument('<memory>', 'Memory to store')
  .option('-c, --categories <categories>', 'Comma-separated categories')
  .action(async (memory, options) => {
    try {
      const response = await api.toolsroamRememberPost({
        memory,
        categories: options.categories?.split(',')
      }) as ApiResponse;
      console.log(chalk.green('\nMemory stored:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('recall')
  .description('Retrieve stored memories')
  .action(async () => {
    try {
      const response = await api.toolsroamRecallPost({}) as ApiResponse;
      console.log(chalk.green('\nMemories:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Search Commands
program
  .command('search-date')
  .description('Search by creation/modification dates')
  .argument('<start-date>', 'Start date (YYYY-MM-DD)')
  .option('-e, --end-date <date>', 'End date (YYYY-MM-DD)')
  .option('-t, --type <type>', 'Search by created/modified/both', 'both')
  .option('-s, --scope <scope>', 'Search blocks/pages/both', 'both')
  .option('-c, --content', 'Include content in results')
  .action(async (startDate, options) => {
    try {
      const response = await api.toolsroamSearchByDatePost({
        start_date: startDate,
        end_date: options.endDate,
        type: options.type,
        scope: options.scope,
        include_content: options.content
      }) as ApiResponse;
      console.log(chalk.green('\nSearch results:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('search-status')
  .description('Search for TODO/DONE blocks')
  .argument('<status>', 'Status to search for (TODO/DONE)')
  .option('-p, --page <page>', 'Page title or UID')
  .option('-i, --include <terms>', 'Comma-separated terms to include')
  .option('-e, --exclude <terms>', 'Comma-separated terms to exclude')
  .action(async (status, options) => {
    try {
      const response = await api.toolsroamSearchByStatusPost({
        status: status as 'TODO' | 'DONE',
        page_title_uid: options.page,
        include: options.include,
        exclude: options.exclude
      }) as ApiResponse;
      console.log(chalk.green('\nSearch results:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('search-tag')
  .description('Search for blocks with specific tags')
  .argument('<tag>', 'Primary tag to search for')
  .option('-p, --page <page>', 'Page title or UID')
  .option('-n, --near <tag>', 'Another tag that must appear nearby')
  .action(async (tag, options) => {
    try {
      const response = await api.toolsroamSearchForTagPost({
        primary_tag: tag,
        page_title_uid: options.page,
        near_tag: options.near
      }) as ApiResponse;
      console.log(chalk.green('\nSearch results:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('search-refs')
  .description('Search for block references')
  .option('-b, --block <uid>', 'Block UID to find references to')
  .option('-p, --page <page>', 'Page title or UID to search in')
  .action(async (options) => {
    try {
      const response = await api.toolsroamSearchBlockRefsPost({
        block_uid: options.block,
        page_title_uid: options.page
      }) as ApiResponse;
      console.log(chalk.green('\nReferences found:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('search-hierarchy')
  .description('Search block hierarchy')
  .option('-p, --parent <uid>', 'Parent block UID to find children of')
  .option('-c, --child <uid>', 'Child block UID to find parents of')
  .option('-g, --page <page>', 'Page title or UID to search in')
  .option('-d, --depth <number>', 'How many levels to search', '1')
  .action(async (options) => {
    try {
      const response = await api.toolsroamSearchHierarchyPost({
        parent_uid: options.parent,
        child_uid: options.child,
        page_title_uid: options.page,
        max_depth: parseInt(options.depth)
      }) as ApiResponse;
      console.log(chalk.green('\nHierarchy results:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Block Update Commands
program
  .command('update-block')
  .description('Update a block\'s content')
  .argument('<uid>', 'Block UID')
  .option('-c, --content <text>', 'New content')
  .option('-f, --find <pattern>', 'Text/regex to find')
  .option('-r, --replace <text>', 'Text to replace with')
  .option('-g, --global', 'Replace all occurrences')
  .action(async (uid, options) => {
    try {
      const request: any = { block_uid: uid };
      
      if (options.content) {
        request.content = options.content;
      } else if (options.find && options.replace) {
        request.transform_pattern = {
          find: options.find,
          replace: options.replace,
          global: options.global
        };
      }
      
      const response = await api.toolsroamUpdateBlockPost(request) as ApiResponse;
      console.log(chalk.green('\nBlock updated:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Advanced Commands
program
  .command('query')
  .description('Execute a custom Datomic query')
  .argument('<query>', 'Datomic query string')
  .option('-i, --inputs <values>', 'Comma-separated input parameters')
  .action(async (query, options) => {
    try {
      const response = await api.toolsroamDatomicQueryPost({
        query,
        inputs: options.inputs?.split(',')
      }) as ApiResponse;
      console.log(chalk.green('\nQuery results:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('fetch-page')
  .description('Fetch complete page contents')
  .argument('<title>', 'Page title')
  .action(async (title) => {
    try {
      const response = await api.toolsroamFetchPageByTitlePost({
        title
      }) as ApiResponse;
      console.log(chalk.green('\nPage contents:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

program
  .command('modified-today')
  .description('Find pages modified today')
  .action(async () => {
    try {
      const response = await api.toolsfindPagesModifiedTodayPost({}) as ApiResponse;
      console.log(chalk.green('\nModified pages:'));
      console.log(inspect(response.data, { colors: true, depth: null }));
    } catch (error: unknown) {
      handleError(error as ErrorResponse);
    }
  });

// Helper function for error handling
function handleError(err: ErrorResponse) {
  if (err.response?.data) {
    console.error(chalk.red('API Error:'), err.response.data);
  } else if (err.message) {
    console.error(chalk.red('Error:'), err.message);
  } else {
    console.error(chalk.red('Unknown error:'), err);
  }
  //console.error(chalk.gray('\nDebug info:'));
  //console.error(chalk.gray(inspect(err, { depth: null, colors: true })));
}

// Parse command line arguments
program.parse(); 