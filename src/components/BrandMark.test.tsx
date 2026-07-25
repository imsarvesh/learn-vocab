import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("shows Spell Quest with the logo", () => {
    render(<BrandMark />);
    expect(screen.getByRole("img", { name: /spell quest/i })).toBeInTheDocument();
    expect(screen.getByText("Spell Quest")).toBeInTheDocument();
  });

  it("supports compact styling", () => {
    const { container } = render(<BrandMark compact />);
    expect(container.querySelector(".brand.compact")).toBeTruthy();
  });
});
