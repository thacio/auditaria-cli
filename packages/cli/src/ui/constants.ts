/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { t } from '@thacio/auditaria-cli-core';

const EstimatedArtWidth = 59;
const BoxBorderWidth = 1;
export const BOX_PADDING_X = 1;

// Calculate width based on art, padding, and border
export const UI_WIDTH =
  EstimatedArtWidth + BOX_PADDING_X * 2 + BoxBorderWidth * 2; // ~63

export const STREAM_DEBOUNCE_MS = 100;

export const SHELL_COMMAND_NAME = t('tools.shell.name', 'Shell Command');
