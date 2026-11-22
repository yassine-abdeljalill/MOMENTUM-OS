import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getThemeSurfaceTokens,
  normalizeThemePreference,
  resolveThemeMode,
  toggleThemePreference,
} from './theme';

test('normalizeThemePreference validates supported modes and falls back safely', () => {
  assert.equal(normalizeThemePreference('light'), 'light');
  assert.equal(normalizeThemePreference('dark'), 'dark');
  assert.equal(normalizeThemePreference('system'), 'system');
  assert.equal(normalizeThemePreference('unknown'), 'light');
  assert.equal(normalizeThemePreference(null), 'light');
});

test('resolveThemeMode resolves light, dark, and system preferences deterministically', () => {
  assert.equal(resolveThemeMode('light', true), 'light');
  assert.equal(resolveThemeMode('light', false), 'light');
  assert.equal(resolveThemeMode('dark', false), 'dark');
  assert.equal(resolveThemeMode('dark', true), 'dark');
  assert.equal(resolveThemeMode('system', true), 'dark');
  assert.equal(resolveThemeMode('system', false), 'light');
});

test('toggleThemePreference switches opposite to the currently active appearance', () => {
  assert.equal(toggleThemePreference('light', 'light'), 'dark');
  assert.equal(toggleThemePreference('dark', 'dark'), 'light');
  assert.equal(toggleThemePreference('system', 'dark'), 'light');
  assert.equal(toggleThemePreference('system', 'light'), 'dark');
});

test('getThemeSurfaceTokens returns Apple monochrome tokens for light and dark themes', () => {
  const light = getThemeSurfaceTokens('light');
  const dark = getThemeSurfaceTokens('dark');
  assert.equal(light.canvasBg, '#F5F5F7');
  assert.equal(light.colorScheme, 'light');
  assert.equal(dark.canvasBg, '#000000');
  assert.equal(dark.surfaceBg, '#161618');
  assert.equal(dark.colorScheme, 'dark');
});
