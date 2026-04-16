import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  const { userRole } = useAuth();
  const insets = useSafeAreaInsets();

  // Determine which tabs are hidden based on role
  const isPlayer = userRole === 'player';
  const isCoach  = userRole === 'coach';
  const isTeam   = userRole === 'team';

  // stats: shown only for player
  const statsHidden = !isPlayer;
  // analysis: shown for coach and default; hidden for player and team
  const analysisHidden = isPlayer || isTeam;
  // team tab: shown only for team role
  const teamTabHidden = !isTeam;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.subtext,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="lessons"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="learn"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="scouting"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          href: analysisHidden ? null : undefined,
          title: '분석',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: statsHidden ? null : undefined,
          title: '내 스탯',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          href: teamTabHidden ? null : undefined,
          title: '팀',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏟️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="icechess"
        options={{
          title: 'Ice Chess',
          tabBarIcon: ({ focused }) => <TabIcon emoji="♟️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
