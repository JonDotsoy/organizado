interface Props {
  unitDisplay: "short" | "long" | "narrow" | undefined;
}

export const durationString = (ms: number, props?: Props) => {
  const timerList: string[] = [];
  const style = "unit";
  const maximumFractionDigits = 0;
  const unitDisplay = props?.unitDisplay ?? "short";

  if (ms > 86_400_000) {
    timerList.push(
      (ms / 86_400_000).toLocaleString(undefined, {
        style,
        unit: "day",
        unitDisplay,
        maximumFractionDigits,
      }),
    );
  }
  if (ms > 3_600_000) {
    timerList.push(
      ((ms / 3_600_000) % 24).toLocaleString(undefined, {
        style,
        unit: "hour",
        unitDisplay,
        maximumFractionDigits,
      }),
    );
  }
  if (ms > 60_000) {
    timerList.push(
      ((ms / 60_000) % 60).toLocaleString(undefined, {
        style,
        unit: "minute",
        unitDisplay,
        maximumFractionDigits,
      }),
    );
  }
  if (ms > 1_000) {
    timerList.push(
      ((ms / 1_000) % 60).toLocaleString(undefined, {
        style,
        unit: "second",
        unitDisplay,
        maximumFractionDigits,
      }),
    );
  }

  if (timerList.length === 0) {
    timerList.push(
      (ms % 1000).toLocaleString(undefined, {
        style,
        unit: "millisecond",
        unitDisplay,
        maximumFractionDigits,
      }),
    );
  }

  return new Intl.ListFormat().format(timerList);
};
