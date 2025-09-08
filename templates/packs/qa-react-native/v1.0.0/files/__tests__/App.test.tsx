import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

function App() {
  return <Text accessibilityRole="header">{{PROJECT_NAME}}</Text>;
}

test("renders app header", () => {
  const { getByRole } = render(<App />);
  expect(getByRole("header")).toBeTruthy();
});

