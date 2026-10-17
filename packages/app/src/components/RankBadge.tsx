import type { RankInfo } from '@sartre/core';
import { Text, useTheme } from '@sartre/ui';
import { View } from 'react-native';
import { useSettings } from '../settings';

/**
 * Rank as position (#3 of 12), derived score (8.4), or both, per the prototype
 * setting. This is one of the open product questions, so it's switchable everywhere.
 */
export function RankBadge({ rank, showTotal = false, size = 'sm' }: { rank: RankInfo; showTotal?: boolean; size?: 'sm' | 'lg' }) {
  const { rankDisplay } = useSettings().settings;
  const { colors } = useTheme();
  const showPosition = rankDisplay !== 'score';
  const showScore = rankDisplay !== 'position';
  const big = size === 'lg';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: big ? 12 : 8 }}>
      {showPosition ? (
        <Text variant={big ? 'stat' : 'mono'} tone={big ? 'default' : 'muted'}>
          #{rank.position}
          {showTotal ? <Text variant={big ? 'heading' : 'mono'} tone="faint">{` of ${rank.total}`}</Text> : null}
        </Text>
      ) : null}
      {showScore ? (
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: colors[rank.bucket],
            paddingHorizontal: big ? 10 : 6,
            paddingVertical: big ? 3 : 1,
          }}
        >
          <Text variant="mono" tone={rank.bucket} style={[{ fontWeight: '600' }, big && { fontSize: 20, lineHeight: 26 }]}>
            {rank.score.toFixed(1)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
