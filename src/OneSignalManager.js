// OneSignal Web SDK wrapper
// All OneSignal interactions go through this module

const ONESIGNAL_APP_ID = process.env.REACT_APP_ONESIGNAL_APP_ID || 'e259a514-0c1c-4807-ba6b-d60fccf234c3';
const ONESIGNAL_REST_KEY = process.env.REACT_APP_ONESIGNAL_REST_API_KEY;

let initialized = false;

export const OneSignalManager = {
  async initialize() {
    if (initialized || typeof window === 'undefined') return;
    try {
      await window.OneSignalDeferred?.push(async (OneSignal) => {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          promptOptions: {
            slidedown: {
              prompts: [{
                type: 'push',
                autoPrompt: true,
                text: {
                  actionMessage: 'Get notified about cornhole games, tournaments, and trash talk!',
                  acceptButton: "Let's go!",
                  cancelButton: 'Nah',
                },
                delay: { pageViews: 1, timeDelay: 5 },
              }]
            }
          }
        });
        initialized = true;
      });
    } catch (e) {
      console.error('OneSignal init error:', e);
    }
  },

  async setExternalId(userId) {
    window.OneSignalDeferred?.push((OneSignal) => {
      OneSignal.login(userId);
    });
  },

  async setTags(tags) {
    window.OneSignalDeferred?.push((OneSignal) => {
      OneSignal.User.addTags(tags);
    });
  },

  // Send a notification to all subscribers via REST API
  async sendNotification({ title, message, data = {} }) {
    if (!ONESIGNAL_REST_KEY) {
      console.warn('OneSignal REST key not set');
      return;
    }
    try {
      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          included_segments: ['Total Subscriptions'],
          headings: { en: title },
          contents: { en: message },
          data,
          url: window.location.origin,
        }),
      });
    } catch (e) {
      console.error('OneSignal send error:', e);
    }
  },

  // Notification helpers
  async notifyGameResult(winners, losers, winScore, loseScore, trashTalk) {
    await this.sendNotification({
      title: `🎯 ${winners} win ${winScore}–${loseScore}`,
      message: trashTalk || `${winners} beat ${losers}!`,
      data: { type: 'game_result' },
    });
  },

  async notifySessionOpen(sessionType) {
    const time = sessionType === 'morning' ? '10am' : '3pm';
    await this.sendNotification({
      title: `🎯 Cornhole check-in is open!`,
      message: `Tap to check in for the ${sessionType} session. Locks at ${time}.`,
      data: { type: 'session_open', sessionType },
    });
  },

  async notifySessionWarning(sessionType) {
    const time = sessionType === 'morning' ? '10am' : '3pm';
    await this.sendNotification({
      title: `⏰ 15 minutes until check-in closes!`,
      message: `${sessionType === 'morning' ? 'Morning' : 'Afternoon'} session locks at ${time}. Check in now!`,
      data: { type: 'session_warning', sessionType },
    });
  },

  async notifyTeamsAnnounced(team1, team2, aiPreview) {
    await this.sendNotification({
      title: `🏆 Game time! Teams are set`,
      message: aiPreview || `${team1} vs ${team2} — let's play!`,
      data: { type: 'teams_announced' },
    });
  },

  async notifySessionCancelled(sessionType) {
    await this.sendNotification({
      title: `❌ Session cancelled`,
      message: `Not enough players checked in for the ${sessionType} session. Better luck next time!`,
      data: { type: 'session_cancelled' },
    });
  },

  async notifyWeeklyAwards(masterName, clownName) {
    await this.sendNotification({
      title: `🏆 Weekly awards are in!`,
      message: `Master Cornholer: ${masterName} 🏆 | Cornhole Clown: ${clownName} 🤡`,
      data: { type: 'weekly_awards' },
    });
  },

  async notifyPerfectRound(playerName) {
    await this.sendNotification({
      title: `🎯 PERFECT ROUND!`,
      message: `${playerName} just sank all 4 bags in the hole. Absolute legend.`,
      data: { type: 'perfect_round' },
    });
  },

  async notifyComeback(winners, losers) {
    await this.sendNotification({
      title: `🔥 COMEBACK ALERT`,
      message: `${winners} were down 7+ points and came back to beat ${losers}. Unbelievable!`,
      data: { type: 'comeback' },
    });
  },

  async notifyShutout(losers) {
    await this.sendNotification({
      title: `💀 SHUTOUT`,
      message: `${losers} got absolutely zero points. Pour one out.`,
      data: { type: 'shutout' },
    });
  },
};
