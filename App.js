import { View } from "react-native";
import Board from './2048'

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "grey",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Board />
    </View>
  );
}
