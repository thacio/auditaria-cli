/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandKind, SlashCommand } from './types.js';
import { t } from '@thacio/auditaria-cli-core';

export const vimCommand: SlashCommand = {
  name: 'vim',
  description: t('commands.vim.description', 'toggle vim mode on/off', {}),
  kind: CommandKind.BUILT_IN,
  action: async (context, _args) => {
    const newVimState = await context.ui.toggleVimEnabled();

    const message = newVimState
      ? t('commands.vim.entered', 'Entered Vim mode. Run /vim again to exit.', {})
      : t('commands.vim.exited', 'Exited Vim mode.', {});
    return {
      type: 'message',
      messageType: 'info',
      content: message,
    };
  },
};
