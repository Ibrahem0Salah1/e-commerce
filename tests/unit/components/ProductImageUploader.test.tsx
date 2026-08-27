import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { ProductImageUploader } from "@/components/admin/formComponents/ProductImageUploader";

vi.mock("@/lib/utils/hash", () => ({
  computeFileHash: vi.fn().mockResolvedValue("hash-abc"),
}));
vi.mock("@/lib/utils/compress", () => ({
  compressImage: vi.fn((file: File) => Promise.resolve(file)),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const URL_A = "https://r2.example.com/a.jpg";
const URL_B = "https://r2.example.com/b.jpg";
const URL_NEW = "https://r2.example.com/new.jpg";

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

async function dropFile(
  container: HTMLElement,
  fileName = "img.png",
): Promise<void> {
  const input = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  const file = new File(["data"], fileName, { type: "image/png" });
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}

describe("ProductImageUploader", () => {
  it("seeds existing (persisted) images on mount", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ProductImageUploader value={[URL_A, URL_B]} onChange={onChange} />,
    );

    await waitFor(() =>
      expect(screen.getAllByAltText("Product preview")).toHaveLength(2),
    );
    expect(screen.getByText("2 / 5 images")).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });

  it("removing a persisted image does NOT call the R2 delete route and emits the trimmed list", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ProductImageUploader value={[URL_A, URL_B]} onChange={onChange} />,
    );

    await waitFor(() =>
      expect(screen.getAllByAltText("Product preview")).toHaveLength(2),
    );

    const user = userEvent.setup();
    const deleteButtons = container.querySelectorAll("button");
    expect(deleteButtons).toHaveLength(2);
    await user.click(deleteButtons[0]);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([URL_B]));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploading a fresh image reuses the URL when the hash already exists", async () => {
    stubUpload(true);
    const onChange = vi.fn();
    const { container } = render(
      <ProductImageUploader value={[URL_A]} onChange={onChange} />,
    );

    await waitFor(() =>
      expect(screen.getAllByAltText("Product preview")).toHaveLength(1),
    );

    await dropFile(container);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([URL_A, URL_NEW]),
    );
    expect(screen.getByText("2 / 5 images")).toBeInTheDocument();
  });

  it("removing a freshly uploaded image calls the R2 delete route and emits the remaining list", async () => {
    stubUpload(true);
    const onChange = vi.fn();
    const { container } = render(
      <ProductImageUploader value={[URL_A]} onChange={onChange} />,
    );

    await waitFor(() =>
      expect(screen.getAllByAltText("Product preview")).toHaveLength(1),
    );

    await dropFile(container);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([URL_A, URL_NEW]),
    );

    const user = userEvent.setup();
    const deleteButtons = container.querySelectorAll("button");
    await user.click(deleteButtons[1]);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([URL_A]));
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
      <ProductImageUploader value={[]} onChange={onChange} />,
    );

    await dropFile(container);

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText("Failed")).toBeInTheDocument(),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides the dropzone and shows the full count when the max is reached", async () => {
    const onChange = vi.fn();
    const images = Array.from(
      { length: 5 },
      (_, i) => `https://r2.example.com/${i}.jpg`,
    );
    const { container } = render(
      <ProductImageUploader value={images} onChange={onChange} />,
    );

    await waitFor(() =>
      expect(screen.getAllByAltText("Product preview")).toHaveLength(5),
    );
    expect(screen.getByText("5 / 5 images")).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});
