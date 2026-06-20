import { ScrollView, StyleSheet, View } from "react-native";

import { homeData } from "@/data/homeData";
import {
  CurrentFocusCard,
  GoalCard,
  HomeHeader,
  SectionTitle,
} from "@/components/home";
import { colors } from "@/theme/colors";

export default function HomeScreen() {
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
          <GoalCard key={goal.id} goal={goal} />
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
