import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("shows Spell Quest with the logo", () => {
    const { getByRole, getByText } = render(<BrandMark />);
    expect(getByRole("img", { name: /spell quest/i })).toBeTruthy();
    expect(getByText("Spell Quest")).toBeTruthy();
  });

  it("supports compact styling", () => {
    const { container } = render(<BrandMark compact />);
    expect(container.querySelector(".brand.compact")).toBeTruthy();
  });
});
