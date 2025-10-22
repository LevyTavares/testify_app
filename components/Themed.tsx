import React from "react";
import { Text as RNText, View as RNView } from "react-native";

// Aceitamos props arbitrárias (incluindo lightColor/darkColor usados no template original)
export function Text(props: any) {
  const { style, ...rest } = props;
  return <RNText style={style} {...rest} />;
}

export function View(props: any) {
  const { style, ...rest } = props;
  return <RNView style={style} {...rest} />;
}

export default { Text, View };
