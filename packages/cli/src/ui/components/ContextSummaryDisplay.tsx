/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { t } from '@thacio/auditaria-cli-core';

import React from 'react';
import { Text } from 'ink';
import { Colors } from '../colors.js';
import { type MCPServerConfig } from '@thacio/auditaria-cli-core';

interface ContextSummaryDisplayProps {
  geminiMdFileCount: number;
  contextFileNames: string[];
  mcpServers?: Record<string, MCPServerConfig>;
  showToolDescriptions?: boolean;
}

export const ContextSummaryDisplay: React.FC<ContextSummaryDisplayProps> = ({
  geminiMdFileCount,
  contextFileNames,
  mcpServers,
  showToolDescriptions,
}) => {
  const mcpServerCount = Object.keys(mcpServers || {}).length;

  if (geminiMdFileCount === 0 && mcpServerCount === 0) {
    return <Text> </Text>; // Render an empty space to reserve height
  }

  const geminiMdText = (() => {
    if (geminiMdFileCount === 0) {
      return '';
    }
    const allNamesTheSame = new Set(contextFileNames).size < 2;
    const name = allNamesTheSame ? contextFileNames[0] : 'context';
    return t('context_summary.context_files', '{count} {name} file{plural}', {
      count: geminiMdFileCount,
      name,
      plural: geminiMdFileCount > 1 ? 's' : ''
    });
  })();

  const mcpText =
    mcpServerCount > 0
      ? t('context_summary.mcp_servers', '{count} MCP server{plural}', {
          count: mcpServerCount,
          plural: mcpServerCount > 1 ? 's' : ''
        })
      : '';

  let summaryText = t('context_summary.using', 'Using ');
  if (geminiMdText) {
    summaryText += geminiMdText;
  }
  if (geminiMdText && mcpText) {
    summaryText += t('context_summary.and', ' and ');
  }
  if (mcpText) {
    summaryText += mcpText;
    // Add ctrl+t hint when MCP servers are available
    if (mcpServers && Object.keys(mcpServers).length > 0) {
      if (showToolDescriptions) {
        summaryText += t('context_summary.ctrl_t_toggle', ' (ctrl+t to toggle)');
      } else {
        summaryText += t('context_summary.ctrl_t_view', ' (ctrl+t to view)');
      }
    }
  }

  return <Text color={Colors.Gray}>{summaryText}</Text>;
};
