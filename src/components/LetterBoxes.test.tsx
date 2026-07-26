import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LetterBoxes } from "./LetterBoxes";

describe("LetterBoxes", () => {
  it("renders one box per letter and gaps for spaces", () => {
    const { container } = render(
      <LetterBoxes word="ice cream" value="" onChange={() => {}} onComplete={() => {}} />,
    );
    expect(container.querySelectorAll(".letter-box").length).toBe(8);
    expect(container.querySelectorAll(".letter-gap").length).toBe(1);
  });

  it("types letters into the hidden input and calls onChange", () => {
    const onChange = vi.fn();
    render(
      <LetterBoxes word="cat" value="" onChange={onChange} onComplete={() => {}} />,
    );
    const input = screen.getByLabelText(/spelling/i);
    fireEvent.change(input, { target: { value: "ca" } });
    expect(onChange).toHaveBeenCalledWith("CA");
  });

  it("calls onComplete when value becomes full", () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <LetterBoxes word="cat" value="ca" onChange={() => {}} onComplete={onComplete} />,
    );
    rerender(
      <LetterBoxes word="cat" value="cat" onChange={() => {}} onComplete={onComplete} />,
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
