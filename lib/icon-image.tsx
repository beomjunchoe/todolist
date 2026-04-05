type IconMeasurements = {
  outer: { size: number; radius: number };
  middle: { size: number; radius: number };
  inner: { size: number; radius: number };
  checkBox: { size: number; left: number; top: number };
  checkMarkWidth: number;
  label: { fontSize: number; left: number; top: number };
  bar1: { height: number; left: number; width: number };
  bar2: { height: number; left: number; width: number };
  star: { size: number; right: number; top: number };
};

export const ICON_MEASUREMENTS: IconMeasurements = {
  outer: { size: 152, radius: 44 },
  middle: { size: 124, radius: 36 },
  inner: { size: 98, radius: 28 },
  checkBox: { size: 44, left: 12, top: 14 },
  checkMarkWidth: 24,
  label: { fontSize: 28, left: 60, top: 16 },
  bar1: { height: 20, left: 12, width: 32 },
  bar2: { height: 20, left: 48, width: 38 },
  star: { size: 18, right: 10, top: 8 },
};

export const APPLE_ICON_MEASUREMENTS: IconMeasurements = {
  outer: { size: 146, radius: 42 },
  middle: { size: 118, radius: 34 },
  inner: { size: 94, radius: 26 },
  checkBox: { size: 42, left: 10, top: 14 },
  checkMarkWidth: 22,
  label: { fontSize: 24, left: 56, top: 16 },
  bar1: { height: 18, left: 10, width: 30 },
  bar2: { height: 18, left: 44, width: 36 },
  star: { size: 16, right: 9, top: 8 },
};

export function buildIconJsx(m: IconMeasurements) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#f4efe4",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#13221d",
          borderRadius: m.outer.radius,
          display: "flex",
          height: m.outer.size,
          justifyContent: "center",
          width: m.outer.size,
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#fff9f0",
            borderRadius: m.middle.radius,
            display: "flex",
            height: m.middle.size,
            justifyContent: "center",
            position: "relative",
            width: m.middle.size,
          }}
        >
          <div
            style={{
              background: "#ec6c2f",
              borderRadius: m.inner.radius,
              display: "flex",
              height: m.inner.size,
              position: "relative",
              width: m.inner.size,
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#fff7ee",
                borderRadius: 16,
                display: "flex",
                height: m.checkBox.size,
                justifyContent: "center",
                left: m.checkBox.left,
                position: "absolute",
                top: m.checkBox.top,
                width: m.checkBox.size,
              }}
            >
              <div
                style={{
                  borderBottom: "6px solid #ec6c2f",
                  borderLeft: "6px solid #ec6c2f",
                  height: 14,
                  transform: "rotate(-45deg)",
                  width: m.checkMarkWidth,
                }}
              />
            </div>
            <div
              style={{
                color: "#fff7ee",
                fontSize: m.label.fontSize,
                fontWeight: 700,
                left: m.label.left,
                lineHeight: 1,
                position: "absolute",
                top: m.label.top,
              }}
            >
              3-1
            </div>
            <div
              style={{
                background: "#fff7ee",
                borderRadius: 12,
                bottom: 12,
                height: m.bar1.height,
                left: m.bar1.left,
                position: "absolute",
                width: m.bar1.width,
              }}
            />
            <div
              style={{
                background: "#ffd8c5",
                borderRadius: 12,
                bottom: 12,
                height: m.bar2.height,
                left: m.bar2.left,
                position: "absolute",
                width: m.bar2.width,
              }}
            />
            <div
              style={{
                background: "#ffd449",
                borderRadius: 999,
                height: m.star.size,
                position: "absolute",
                right: m.star.right,
                top: m.star.top,
                width: m.star.size,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
