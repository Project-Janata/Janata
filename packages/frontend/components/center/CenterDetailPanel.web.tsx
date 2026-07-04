import React, { useMemo, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, Linking } from 'react-native'
import { MapPin, Globe, Phone, User, ChevronLeft, Navigation, BadgeCheck, Users } from 'lucide-react-native'
import CopyLinkButton from '../ui/CopyLinkButton'
import { DetailSection } from '../ui'
import { CenterAbout } from './CenterAbout'
import { useBoard, type CenterDisplay } from '../../hooks/useApiData'
import { createBoardPost, type EventDisplay } from '../../utils/api'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useColors } from '../../hooks/useColors'
import { ThreadPanel, boardPostToMessage } from '../boards'
import type { BoardMessage } from '../boards'
import { PostThread, type FeedPost } from '../feed'
import { buildFeedPostFromMessage } from '../feed/feedData'
import { useUser } from '../contexts'

// ── Props ────────────────────────────────────────────────────────────────

type CenterDetailPanelProps = {
  center: CenterDisplay
  events: EventDisplay[]
  onClose: () => void
  onEventPress: (eventId: string) => void
}

// ── Date helper ──────────────────────────────────────────────────────────

function formatDateCallout(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase()
  const day = String(d.getDate())
  return { month, day }
}

// ── Component ────────────────────────────────────────────────────────────

export default function CenterDetailPanel({
  center,
  events,
  onClose,
  onEventPress,
}: CenterDetailPanelProps) {
  const colors = useDetailColors()
  const appColors = useColors()
  const { user } = useUser()
  const [threadDetailPost, setThreadDetailPost] = useState<FeedPost | null>(null)

  const handleAddressPress = () => {
    const query = encodeURIComponent(center.address)
    Linking.openURL(`https://maps.google.com/?q=${query}`)
  }

  const handleWebsitePress = () => {
    const url = center.website.startsWith('http')
      ? center.website
      : `https://${center.website}`
    Linking.openURL(url)
  }

  const handlePhonePress = () => {
    Linking.openURL(`tel:${center.phone}`)
  }

  // Strip protocol for display
  const displayWebsite = center.website
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
  const canPostToThread =
    !!user && (user.centerID === center.id || (user.verificationLevel ?? 0) >= 107)
  const canEditCenter = !!user && (user.verificationLevel ?? 0) >= 107
  // Only render the About section when there's something to show (description or
  // point of contact) or the viewer can add it — otherwise CenterAbout returns
  // null and the section header is left orphaned above Details.
  const showAbout =
    canEditCenter || !!center.description?.trim() || !!center.pointOfContact?.trim()
  const { posts: boardPosts, refetch: refetchBoard } = useBoard('center', center.id, canPostToThread)
  const boardMessages = useMemo(() => boardPosts.map(boardPostToMessage), [boardPosts])

  const handleCreateThreadPost = async (body: string) => {
    await createBoardPost('center', center.id, body)
    await refetchBoard()
  }

  const openThreadPost = (message: BoardMessage) => {
    setThreadDetailPost(
      buildFeedPostFromMessage(message, {
        groupId: `center-${center.id}`,
        kind: 'center',
        parentId: center.id,
        title: center.name,
        subtitle: center.address || 'Center board',
      })
    )
  }

  if (threadDetailPost) {
    return (
      <View
        style={{
          maxWidth: 440,
          width: '100%',
          height: '100%',
          backgroundColor: appColors.bg,
          borderLeftWidth: 1,
          borderLeftColor: appColors.border,
        }}
      >
        <View style={{ paddingTop: 12 }}>
          <Pressable
            onPress={() => setThreadDetailPost(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to board"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <ChevronLeft size={20} color={appColors.accent} />
            <Text style={{ fontSize: 14, color: appColors.accent }}>Back to board</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <PostThread
            post={threadDetailPost}
            colors={appColors}
            onPostChanged={refetchBoard}
            onPostDeleted={() => {
              setThreadDetailPost(null)
              refetchBoard()
            }}
          />
        </View>
      </View>
    )
  }

  return (
    <View
      style={{
        maxWidth: 440,
        width: '100%',
        height: '100%',
        backgroundColor: colors.panelBg,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        flexDirection: 'column',
      }}
    >
      {/* ── Header bar ──────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 10,
        }}
      >
        {/* Top row: back + copy link */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={onClose}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, minHeight: 44, minWidth: 44 }}
            accessibilityLabel="Close panel"
          >
            <ChevronLeft size={20} color={colors.iconHeader} />
            <Text
              style={{
                fontFamily: 'Inclusive Sans',
                fontSize: 14,
                color: colors.iconHeader,
              }}
            >
              Back
            </Text>
          </Pressable>
          <CopyLinkButton path={`/center/${center.id}`} color={colors.iconHeader} />
        </View>

        {/* Title row */}
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 20,
            color: colors.text,
            lineHeight: 26,
          }}
        >
          {center.name}
        </Text>

        {/* Stats row */}
        {(center.memberCount > 0 || center.isVerified) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {center.memberCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={13} color={colors.textSecondary} />
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 13,
                    color: colors.textSecondary,
                  }}
                >
                  {center.memberCount} {center.memberCount === 1 ? 'member' : 'members'}
                </Text>
              </View>
            )}
            {center.memberCount > 0 && center.isVerified && (
              <Text style={{ fontSize: 13, color: colors.textMuted }}>·</Text>
            )}
            {center.isVerified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <BadgeCheck size={13} color="#E8862A" />
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 13,
                    color: '#E8862A',
                  }}
                >
                  Verified
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Scrollable content ──────────────────────────────────── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <Image
          source={{ uri: center.image }}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />

        {/* ── ABOUT (editable by admins — #285) ───────────────────── */}
        {showAbout ? (
          <DetailSection title="About" first>
            <CenterAbout
              centerId={center.id}
              description={center.description}
              pointOfContact={center.pointOfContact}
              canEdit={canEditCenter}
            />
          </DetailSection>
        ) : null}

        {/* ── DETAILS ─────────────────────────────────────────────── */}
        <DetailSection title="Details" first={!showAbout}>
          {/* ── Meta rows ────────────────────────────────────────── */}
          <View style={{ gap: 16 }}>
            {/* Address */}
            {center.address ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.iconBoxBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={16} color="#E8862A" />
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: 'Inclusive Sans',
                      fontSize: 14,
                      color: colors.text,
                      lineHeight: 20,
                    }}
                  >
                    {center.address}
                  </Text>
                  <Pressable
                    onPress={handleAddressPress}
                    style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
                    accessibilityLabel="Get directions"
                  >
                    <Text
                      style={{
                        fontFamily: 'Inclusive Sans',
                        fontSize: 14,
                        color: '#E8862A',
                      }}
                    >
                      Get directions →
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Website */}
            {center.website ? (
              <Pressable
                onPress={handleWebsitePress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.iconBoxBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={16} color="#E8862A" />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 14,
                    color: '#E8862A',
                    lineHeight: 20,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {displayWebsite}
                </Text>
              </Pressable>
            ) : null}

            {/* Phone */}
            {center.phone ? (
              <Pressable
                onPress={handlePhonePress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.iconBoxBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={16} color="#E8862A" />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 14,
                    color: colors.text,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  {center.phone}
                </Text>
              </Pressable>
            ) : null}

            {/* Acharya */}
            {center.acharya ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.iconBoxBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <User size={16} color="#E8862A" />
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text
                    style={{
                      fontFamily: 'Inclusive Sans',
                      fontSize: 14,
                      color: colors.text,
                      lineHeight: 20,
                    }}
                  >
                    {center.acharya}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inclusive Sans',
                      fontSize: 13,
                      color: colors.textSecondary,
                      lineHeight: 18,
                      marginTop: 2,
                    }}
                  >
                    Resident Acharya
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </DetailSection>

        {/* ── UPCOMING EVENTS ──────────────────────────────────────── */}
        <DetailSection title="Upcoming Events" count={events.length} contentStyle={{ gap: 10 }}>
          {events.length > 0 ? (
            <View style={{ gap: 10 }}>
              {events.map((event) => {
                const { month, day } = formatDateCallout(event.date)
                return (
                  <Pressable
                    key={event.id}
                    onPress={() => onEventPress(event.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.cardBg,
                      borderRadius: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      gap: 12,
                      minHeight: 44,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        minHeight: 50,
                        borderRadius: 10,
                        backgroundColor: colors.iconBoxBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 11,
                          color: '#E8862A',
                          textTransform: 'uppercase',
                          lineHeight: 14,
                        }}
                      >
                        {month}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 22,
                          color: colors.text,
                          lineHeight: 28,
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 14,
                          color: colors.text,
                          lineHeight: 20,
                        }}
                        numberOfLines={2}
                      >
                        {event.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 12,
                          color: colors.textSecondary,
                          lineHeight: 16,
                          marginTop: 2,
                        }}
                      >
                        {event.time} {event.attendees > 0 ? `\u00B7 ${event.attendees} attending` : ''}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          ) : (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textSecondary }}>
                    No upcoming events yet
                  </Text>
                </View>
              )}
        </DetailSection>

        {/* ── BOARD ───────────────────────────────────────────────── */}
        <DetailSection title="Board" count={boardMessages.length} contentStyle={{ paddingHorizontal: 0 }}>
          <ThreadPanel
            messages={boardMessages}
            colors={colors}
            emptyTitle="Be the first to post"
            emptySubtitle={`Ask about rides, what to bring, or anything else for ${center.name}.`}
            composerPlaceholder="Write to the board..."
            composerState={canPostToThread ? 'open' : 'locked'}
            onSubmitPost={handleCreateThreadPost}
            onMessagePress={openThreadPost}
          />
        </DetailSection>
      </ScrollView>
    </View>
  )
}
