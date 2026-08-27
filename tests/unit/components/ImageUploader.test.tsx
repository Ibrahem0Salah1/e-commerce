import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/formComponents/ImageUploader";

vi.mock("@/lib/utils/hash", () => ({
  computeFileHash: vi.fn().mockResolvedValue("hash-abc"),
}));
vi.mock("@/lib/utils/compress", () => ({
  compressImage: vi.fn((file: File) => Promise.resolve(file)),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const URL_A = "https://r2.example.com/cat.png";
const URL_NEW = "https://r2.example.com/new.png";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn(() => "blob:mock"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubUpload(exists: boolean) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url === "/api/s3/upload") {
      return {
        ok: true,
        json: async () => ({
          exists,
          key: "k1",
          publicUrl: URL_NEW,
          presignedUrl: exists ? undefined : "https://presign.example.com/k1",
        }),
      };
    }
    if (url === "/api/s3/delete") {
      return { ok: true, json: async () => ({}) };
    }
    return { ok: true, json: async () => ({}) };
  });
}

async function dropFile(container: HTMLElement): Promise<void> {
  const input = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  const file = new File(["data"], "img.png", { type: "image/png" });
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}

describe("ImageUploader", () => {
  it("seeds an existing (persisted) image on mount", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader value={URL_A} onChange={onChange} />,
    );

    await waitFor(() =>
      expect(screen.getByAltText("Image preview")).toBeInTheDocument(),
    );
    expect(screen.getByText("1 / 1 image")).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it("removing a persisted image does NOT call the R2 delete route and emits null", async () => {
    const onChange = vi.fn();
    render(<ImageUploader value={URL_A} onChange={onChange} />);

    await waitFor(() =>
      expect(screen.getByAltText("Image preview")).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Remove image" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploads a fresh image and emits the returned URL", async () => {
    stubUpload(true);
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader value={null} onChange={onChange} />,
    );

    await dropFile(container);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(URL_NEW));
    expect(screen.getByText("1 / 1 image")).toBeInTheDocument();
  });

  it("removing a freshly uploaded image calls the R2 delete route and emits null", async () => {
    stubUpload(true);
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader value={null} onChange={onChange} />,
    );

    await dropFile(container);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(URL_NEW));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Remove image" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/s3/delete",
      expect.objectContaining({
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "k1" }),
      }),
    );
  });

  it("shows an error toast and marks the entry when the upload fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "boom" }),
    });
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader value={null} onChange={onChange} />,
    );

    await dropFile(container);

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText("Failed")).toBeInTheDocument(),
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
