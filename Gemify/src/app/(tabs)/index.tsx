import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  CurrentFocusCard,
  GoalCard,
  HomeHeader,
  SectionTitle
} from "@/components/home";
import type { Goal } from "@/data/homeData";
import { homeData } from "@/data/homeData";
import { colors } from "@/theme/colors";

// add btn to create new goal has to be in the right of "your goal"
export default function HomeScreen() {
  const router = useRouter();

  function handleGoalPress(goal: Goal) {
    console.log("Opening journey map for goal", goal);
    router.push("/journey-map");
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          greeting={homeData.header.greeting}
          subtitle={homeData.header.subtitle}
        />

        <SectionTitle title="YOUR GOALS" />

        {homeData.goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onPress={handleGoalPress} />
        ))}

        <SectionTitle title="CURRENT FOCUS" />

        {homeData.currentFocus.map((item) => (
          <CurrentFocusCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
