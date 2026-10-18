import { visibilityFor, type Completion, type ProfilePatch, type Visibility } from '@sartre/core';
import { space } from '@sartre/tokens';
import { Avatar, BucketTag, Button, Card, Cover, ProgressBar, SectionLabel, Segmented, Tabs, Text, useTheme, useViewport } from '@sartre/ui';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Banner } from '../components/Banner';
import { MonthlyTimeline } from '../components/MonthlyTimeline';
import { RankBadge } from '../components/RankBadge';
import { authorLine, formatDate, formatNumber, monthName, plural } from '../format';
import { routes, useNav } from '../nav';
import { useOverview, useRank, type Overview } from '../selectors';
import { useSession } from '../session';
import { useSettings } from '../settings';
import { pickImage } from '../pickImage';
import { useLibrary } from '../store';

type TabKey = 'overview' | 'completions' | 'reports';

/** `handle` is the one in the URL. Signed in, it must be yours until public profiles are readable. */
export function ProfileScreen({ handle }: { handle?: string }) {
  const { library, updateProfile } = useLibrary();
  const { settings } = useSettings();
  const session = useSession();
  const nav = useNav();
  const overview = useOverview();
  const ownHandle = library.profile.handle;
  useEffect(() => {
    if (session && handle && handle !== ownHandle) nav.replace(routes.profile(ownHandle));
  }, [session, handle, ownHandle, nav]);
  const { width } = useViewport();
  const compact = width < 720;
  const [tab, setTab] = useState<TabKey>('overview');
  // Edits preview live in the header and only reach the store on Save.
  const [draft, setDraft] = useState<ProfilePatch | null>(null);
  const profile = { ...library.profile, ...draft };
  const owner = settings.viewer === 'owner';
  const vis = visibilityFor(settings.privacy, owner ? 'owner' : 'public');
  const bannerBooks = (overview.ranked.length ? overview.ranked : overview.thisYear.map((c) => c.bookId)).map(overview.book);
  // An uploaded banner is part of the profile shell, so it shows even on a private profile.
  const bannerImage = profile.banner.type === 'image' ? profile.banner.uri : undefined;

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    ...(vis.completions ? [{ key: 'completions' as const, label: 'Completions', count: overview.totalFinished }] : []),
    ...(vis.reports ? [{ key: 'reports' as const, label: 'Reports' }] : []),
  ];

  return (
    <View style={{ gap: space[5] }}>
      <View>
        <Banner
          books={vis.completions ? bannerBooks : []}
          style={settings.banner}
          height={compact ? 150 : 210}
          compact={compact}
          imageUri={bannerImage}
        />
        <View style={{ paddingHorizontal: compact ? space[2] : space[5], marginTop: -36 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Avatar name={profile.displayName} uri={profile.avatarUrl} size={compact ? 72 : 88} />
            {owner && !draft ? <Button label="Edit profile" kind="ghost" onPress={() => setDraft({})} /> : null}
          </View>
          <View style={{ marginTop: space[3], gap: 2 }}>
            <Text variant="title">{profile.displayName}</Text>
            <Text variant="mono" tone="muted">
              @{profile.handle}
            </Text>
            {owner && draft ? (
              <ProfileEditor
                bio={profile.bio ?? ''}
                hasBannerImage={Boolean(bannerImage)}
                onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
                onCancel={() => setDraft(null)}
                onSave={() => {
                  const bio = draft.bio?.trim();
                  updateProfile({ ...draft, ...(draft.bio !== undefined && { bio: bio || undefined }) });
                  setDraft(null);
                }}
              />
            ) : profile.bio ? (
              <Text variant="body" tone="muted" style={{ marginTop: space[2], maxWidth: 520 }}>
                {profile.bio}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {!vis.completions ? (
        <Card>
          <Text variant="heading">This profile is private.</Text>
        </Card>
      ) : library.library.length === 0 ? (
        // A new account: no tabs of empty sections, just the one thing to do.
        owner ? (
          <Card style={{ gap: space[3], alignItems: 'flex-start' }}>
            <Text variant="heading">No books yet.</Text>
            <Button label="Log a book" kind="secondary" onPress={() => nav.push(routes.log())} />
          </Card>
        ) : null
      ) : (
        <>
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          {tab === 'overview' && <OverviewTab o={overview} vis={vis} owner={owner} compact={compact} />}
          {tab === 'completions' && <CompletionsTab o={overview} owner={owner} />}
          {tab === 'reports' && <ReportsTab />}
        </>
      )}
    </View>
  );
}

// ─── Edit profile ───────────────────────────────────────────────────────────

const BIO_MAX = 160;

function ProfileEditor({
  bio,
  hasBannerImage,
  onChange,
  onCancel,
  onSave,
}: {
  bio: string;
  hasBannerImage: boolean;
  onChange: (patch: ProfilePatch) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { colors } = useTheme();
  const pick = async (kind: 'avatar' | 'banner') => {
    const uri = await pickImage(kind);
    if (!uri) return;
    onChange(kind === 'avatar' ? { avatarUrl: uri } : { banner: { type: 'image', uri } });
  };

  return (
    <View style={{ marginTop: space[3], gap: space[3], maxWidth: 520 }}>
      <View style={{ gap: 6 }}>
        <TextInput
          value={bio}
          onChangeText={(text) => onChange({ bio: text })}
          multiline
          maxLength={BIO_MAX}
          placeholder="Bio"
          placeholderTextColor={colors.textFaint}
          accessibilityLabel="Bio"
          style={{
            minHeight: 72,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            color: colors.text,
            backgroundColor: colors.bg,
            textAlignVertical: 'top',
          }}
        />
        <Text variant="mono" tone="faint" style={{ alignSelf: 'flex-end' }}>
          {bio.length}/{BIO_MAX}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap' }}>
        <Button label="Change photo" kind="secondary" onPress={() => pick('avatar')} />
        <Button label="Change banner" kind="secondary" onPress={() => pick('banner')} />
        {hasBannerImage ? (
          <Button label="Use covers" kind="ghost" onPress={() => onChange({ banner: { type: 'topFour' } })} />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: space[2] }}>
        <Button label="Save" onPress={onSave} />
        <Button label="Cancel" kind="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────

function OverviewTab({ o, vis, owner, compact }: { o: Overview; vis: Visibility; owner: boolean; compact: boolean }) {
  const { settings } = useSettings();
  const spansMonths = new Set(o.timeline.filter((m) => m.completions.length).map((m) => `${m.year}-${m.month}`)).size >= 2;

  return (
    <View style={{ gap: space[6] }}>
      {o.latest ? <LatestFinish completion={o.latest} owner={owner} compact={compact} /> : null}

      <View style={{ flexDirection: compact ? 'column' : 'row', gap: space[4] }}>
        {o.thisYear.length >= 2 ? <YearCard o={o} /> : null}
        {vis.activity && o.pagesThisYear > 0 ? <PagesCard o={o} /> : null}
      </View>

      {vis.activity && o.reading.length ? (
        <View>
          <SectionLabel>Currently reading</SectionLabel>
          <View style={{ gap: space[3] }}>
            {o.reading.map((r) => (
              <ReadingRow key={r.entry.bookId} r={r} o={o} owner={owner} />
            ))}
          </View>
        </View>
      ) : null}

      {o.ranked.length >= 2 ? <TopOfList o={o} compact={compact} /> : null}

      {spansMonths ? (
        <View>
          <SectionLabel>By month</SectionLabel>
          <MonthlyTimeline months={o.timeline} book={o.book} view={vis.activity ? settings.monthView : 'covers'} />
        </View>
      ) : null}
    </View>
  );
}

function LatestFinish({ completion, owner, compact }: { completion: Completion; owner: boolean; compact: boolean }) {
  const { library } = useLibrary();
  const nav = useNav();
  const book = library.books.get(completion.bookId)!;
  const rank = useRank(completion.bookId);
  return (
    <Card style={{ flexDirection: 'row', gap: compact ? space[4] : space[6], alignItems: 'center' }}>
      <Pressable onPress={() => nav.push(routes.card(completion.readId))} accessibilityRole="link">
        <Cover book={book} size={compact ? 'md' : 'lg'} />
      </Pressable>
      <View style={{ flex: 1, gap: space[2] }}>
        <Text variant="label" tone="muted">
          Finished {formatDate(completion.finishedAt)}
        </Text>
        <Text variant={compact ? 'heading' : 'title'}>{book.title}</Text>
        <Text variant="small" tone="muted">
          {authorLine(book.authors)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], marginTop: space[1] }}>
          {rank ? <BucketTag bucket={rank.bucket} size="md" /> : null}
          {rank && rank.total >= 3 ? <RankBadge rank={rank} showTotal /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: space[2], marginTop: space[3], flexWrap: 'wrap' }}>
          <Button label="Share card" kind="secondary" onPress={() => nav.push(routes.card(completion.readId))} />
          {owner && rank && rank.total >= 2 ? (
            <Button label="Re-rank" kind="ghost" onPress={() => nav.push(routes.rank(completion.bookId, true))} />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function YearCard({ o }: { o: Overview }) {
  const nav = useNav();
  return (
    <Card style={{ flex: 1.4, gap: space[3] }}>
      <Text variant="label" tone="muted">
        {o.year}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[2] }}>
        <Text variant="statXL">{o.thisYear.length}</Text>
        <Text variant="body" tone="muted">
          {plural(o.thisYear.length, 'book')} finished
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {o.thisYear.map((c) => (
          <Pressable key={c.readId} onPress={() => nav.push(routes.card(c.readId))} accessibilityRole="link">
            <Cover book={o.book(c.bookId)} size="xs" shadow={false} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function PagesCard({ o }: { o: Overview }) {
  const month = monthName(o.now.getMonth());
  const sameAsYear = o.pagesThisMonth === o.pagesThisYear;
  return (
    <Card style={{ flex: 1, gap: space[4], justifyContent: 'center' }}>
      {!sameAsYear && o.pagesThisMonth > 0 ? (
        <View>
          <Text variant="label" tone="muted">
            Pages in {month}
          </Text>
          <Text variant="stat">{formatNumber(o.pagesThisMonth)}</Text>
        </View>
      ) : null}
      <View>
        <Text variant="label" tone="muted">
          {sameAsYear ? `Pages in ${month}` : `Pages in ${o.year}`}
        </Text>
        <Text variant="stat">{formatNumber(o.pagesThisYear)}</Text>
      </View>
    </Card>
  );
}

function ReadingRow({ r, o, owner }: { r: Overview['reading'][number]; o: Overview; owner: boolean }) {
  const { finishBook, checkIn } = useLibrary();
  const nav = useNav();
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(String(r.page));
  const book = o.book(r.entry.bookId);

  const save = () => {
    const n = Number.parseInt(page, 10);
    if (Number.isFinite(n) && n >= 0) checkIn(book.id, r.pageCount ? Math.min(n, r.pageCount) : n);
    setEditing(false);
  };

  return (
    <Card style={{ flexDirection: 'row', gap: space[4], alignItems: 'center' }} padded>
      <Cover book={book} size="sm" />
      <View style={{ flex: 1, gap: 6 }}>
        <Text variant="bodyStrong">{book.title}</Text>
        <Text variant="small" tone="muted">
          {authorLine(book.authors)}
        </Text>
        {r.progress !== undefined ? (
          <View style={{ gap: 6, marginTop: 4 }}>
            <ProgressBar value={r.progress} />
            <Text variant="mono" tone="muted">
              p. {r.page} of {r.pageCount} · {Math.round(r.progress * 100)}%
            </Text>
          </View>
        ) : null}
        {owner ? (
          <View style={{ flexDirection: 'row', gap: space[2], marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {editing ? (
              <>
                <TextInput
                  value={page}
                  onChangeText={setPage}
                  onSubmitEditing={save}
                  keyboardType="number-pad"
                  autoFocus
                  accessibilityLabel="Current page"
                  style={{
                    width: 80,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    color: colors.text,
                    backgroundColor: colors.bg,
                  }}
                />
                <Button label="Save" kind="secondary" onPress={save} />
              </>
            ) : (
              <Button label="Update page" kind="secondary" onPress={() => setEditing(true)} />
            )}
            <Button
              label="Finished"
              kind="ghost"
              onPress={() => {
                finishBook(book.id);
                nav.push(routes.rank(book.id));
              }}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function TopOfList({ o, compact }: { o: Overview; compact: boolean }) {
  const { library } = useLibrary();
  const nav = useNav();
  const top = o.ranked.slice(0, 4);
  const { width } = useViewport();
  const coverWidth = compact ? Math.min(132, (width - 32 - 3 * 12) / 4) : 150;
  const readFor = (bookId: string) => library.completions.findLast((c) => c.bookId === bookId)?.readId;

  return (
    <View>
      <SectionLabel>{top.length === 4 ? 'Top four' : 'Top of the list'}</SectionLabel>
      <View style={{ flexDirection: 'row', gap: compact ? 12 : 20 }}>
        {top.map((id, i) => {
          const book = o.book(id);
          const readId = readFor(id);
          return (
            <Pressable
              key={id}
              onPress={() => readId && nav.push(routes.card(readId))}
              accessibilityRole="link"
              style={{ width: coverWidth, gap: space[2] }}
            >
              <Cover book={book} width={coverWidth} />
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
                <Text variant="mono" tone="faint">
                  {i + 1}
                </Text>
                <Text variant="small" numberOfLines={2} style={{ flex: 1 }}>
                  {book.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Completions ────────────────────────────────────────────────────────────

function CompletionsTab({ o, owner }: { o: Overview; owner: boolean }) {
  const { library } = useLibrary();
  const [order, setOrder] = useState<'ranked' | 'recent'>('ranked');
  const latestRead = (bookId: string) => library.completions.findLast((c) => c.bookId === bookId);
  const recent = [...library.completions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));

  const groups =
    order === 'ranked'
      ? (['loved', 'liked', 'meh'] as const)
          .map((b) => ({ key: b, title: b, ids: library.rankings[b] }))
          .filter((g) => g.ids.length)
      : groupByMonth(recent);

  return (
    <View style={{ gap: space[5] }}>
      {o.totalFinished >= 2 ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <Segmented
            options={[
              { key: 'ranked', label: 'Ranked' },
              { key: 'recent', label: 'Recent' },
            ]}
            value={order}
            onChange={setOrder}
          />
        </View>
      ) : null}
      {groups.map((g) => (
        <View key={g.key}>
          {order === 'ranked' ? (
            <View style={{ marginBottom: space[3] }}>
              <BucketTag bucket={g.title as 'loved' | 'liked' | 'meh'} />
            </View>
          ) : (
            <SectionLabel>{g.title}</SectionLabel>
          )}
          <View style={{ gap: 2 }}>
            {g.ids.map((id) => {
              const c = latestRead(id);
              return c ? <CompletionRow key={c.readId} completion={c} owner={owner} /> : null;
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function groupByMonth(completions: Completion[]) {
  const groups: { key: string; title: string; ids: string[] }[] = [];
  const now = new Date();
  for (const c of completions) {
    const d = new Date(c.finishedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const title = d.getFullYear() === now.getFullYear() ? monthName(d.getMonth()) : `${monthName(d.getMonth())} ${d.getFullYear()}`;
    const g = groups.at(-1);
    if (g?.key === key) g.ids.push(c.bookId);
    else groups.push({ key, title, ids: [c.bookId] });
  }
  return groups;
}

function CompletionRow({ completion, owner }: { completion: Completion; owner: boolean }) {
  const { library } = useLibrary();
  const { colors } = useTheme();
  const nav = useNav();
  const book = library.books.get(completion.bookId)!;
  const rank = useRank(completion.bookId);
  return (
    <Pressable
      onPress={() => nav.push(routes.card(completion.readId))}
      accessibilityRole="link"
      style={(s) => [
        { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2], paddingHorizontal: space[2], borderRadius: 10 },
        (s as { hovered?: boolean }).hovered && { backgroundColor: colors.surface },
      ]}
    >
      <View style={{ width: 28, alignItems: 'flex-end' }}>
        {rank ? (
          <Text variant="mono" tone="faint">
            {rank.position}
          </Text>
        ) : null}
      </View>
      <Cover book={book} size="xs" shadow={false} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 15 }}>
          {book.title}
        </Text>
        <Text variant="small" tone="muted" numberOfLines={1}>
          {authorLine(book.authors)} · {formatDate(completion.finishedAt)}
        </Text>
      </View>
      {rank ? <RankBadge rank={rank} /> : null}
      {owner ? (
        <Pressable onPress={() => nav.push(routes.rank(book.id, true))} accessibilityRole="button" hitSlop={8}>
          <Text variant="small" tone="faint">
            Re-rank
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

// ─── Reports ────────────────────────────────────────────────────────────────

function ReportsTab() {
  return (
    <Card style={{ gap: space[2] }}>
      <Text variant="heading">Reports</Text>
      <Text variant="body" tone="muted" style={{ maxWidth: 520 }}>
        Long-form writing on the books that stayed with you. Arrives in a later version.
      </Text>
    </Card>
  );
}
