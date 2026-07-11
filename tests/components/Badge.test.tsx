import React from "react";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge UI Component", () => {
  it("renders children correctly", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies tone styles correctly", () => {
    const { container } = render(<Badge tone="success">Success</Badge>);
    expect(container.firstChild).toHaveClass("bg-[var(--color-success-surface)]");
  });

  it("renders a status indicator dot when dot prop is true", () => {
    const { container } = render(<Badge dot tone="danger">Alert</Badge>);
    // Dot indicator is a span inside the badge
    expect(container.querySelector(".rounded-full")).toBeInTheDocument();
  });
});
