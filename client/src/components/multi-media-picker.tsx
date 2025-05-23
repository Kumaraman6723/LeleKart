import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import {
  getMediaItems,
  uploadMediaItem,
  MediaItem,
  formatFileSize,
} from "@/lib/mediaLibraryApi";
import {
  Image,
  Upload,
  Search,
  RefreshCw,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface MultiMediaPickerProps {
  onSelect: (urls: string[]) => void;
  selectedUrls?: string[];
  buttonLabel?: string;
  maxImages?: number;
}

export function MultiMediaPicker({
  onSelect,
  selectedUrls = [],
  buttonLabel = "Select Images",
  maxImages = 999,
}: MultiMediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);
  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]);
  const [uploadTab, setUploadTab] = useState<"browse" | "upload">("browse");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [alt, setAlt] = useState("");
  const [tags, setTags] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const { toast } = useToast();

  // Media library query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/media", page, 20, search],
    queryFn: () => getMediaItems(page, 20, search),
    enabled: open, // Only fetch when dialog is open
  });

  // Reset selected media IDs when dialog opens
  // but maintain any existing selections from previously selected URLs
  useEffect(() => {
    if (open && data) {
      // Find media items that match the selected URLs
      const matchingItems = data.items.filter((item) =>
        selectedUrls.includes(item.url)
      );

      // Set the selected media IDs based on these items
      setSelectedMediaIds(matchingItems.map((item) => item.id));
      setSelectedMediaItems((prev) => {
        // Combine previously selected items with newly matched items
        const existingIds = prev.map((p) => p.id);
        return [
          ...prev,
          ...matchingItems.filter((item) => !existingIds.includes(item.id)),
        ];
      });
    }
  }, [open, data, selectedUrls]);

  // Clear upload state when tab changes
  useEffect(() => {
    if (uploadTab === "browse") {
      setSelectedFiles([]);
      setAlt("");
      setTags("");
    }
  }, [uploadTab]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to Array
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();

      // Append all files
      selectedFiles.forEach((file) => {
        formData.append("file", file);
      });

      if (alt) formData.append("alt", alt);
      if (tags) formData.append("tags", tags);

      const response = await uploadMediaItem(formData);

      // Handle both single and multiple file uploads
      if ("items" in response) {
        // Multiple files were uploaded
        const newItems = response.items as MediaItem[];

        // Add the new items to the selected media items
        setSelectedMediaItems((prev) => [...prev, ...newItems]);

        // Add the new item IDs to the selected media IDs
        setSelectedMediaIds((prev) => [
          ...prev,
          ...newItems.map((item) => item.id),
        ]);
      } else {
        // Single file was uploaded
        const newItem = response as MediaItem;

        // Add the new item to the selected media items
        setSelectedMediaItems((prev) => [...prev, newItem]);

        // Add the new item ID to the selected media IDs
        setSelectedMediaIds((prev) => [...prev, newItem.id]);
      }

      // Refetch the media library to show the new items
      refetch();

      // Switch to browse tab to show the newly uploaded items
      setUploadTab("browse");

      toast({
        title: "Upload successful",
        description:
          selectedFiles.length === 1
            ? "File has been uploaded and selected"
            : `${selectedFiles.length} files have been uploaded and selected`,
      });

      // Clear the selected files
      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading",
        variant: "destructive",
      });
    }
  };

  // Handle search
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  // Toggle item selection
  const toggleItemSelection = (item: MediaItem) => {
    setSelectedMediaItems((prev) => {
      if (selectedMediaIds.includes(item.id)) {
        // Remove item
        return prev.filter((i) => i.id !== item.id);
      } else {
        // Add item
        return [...prev, item];
      }
    });

    setSelectedMediaIds((prev) => {
      if (prev.includes(item.id)) {
        // Remove ID
        return prev.filter((id) => id !== item.id);
      } else {
        // Add ID
        return [...prev, item.id];
      }
    });
  };

  // Remove a selected item
  const removeSelectedItem = (itemId: number) => {
    setSelectedMediaItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedMediaIds((prev) => prev.filter((id) => id !== itemId));
  };

  // Handle final selection
  const handleSelect = () => {
    const urls = selectedMediaItems.map((item) => item.url);
    onSelect(urls);
    setOpen(false);
  };

  return (
    <div>
      <div className="space-y-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">{buttonLabel}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Media Library</DialogTitle>
              <DialogDescription>
                Select media files from your library or upload new ones.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-grow overflow-hidden flex flex-col">
              {selectedMediaItems.length > 0 && (
                <div className="bg-muted p-2 mb-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <Label>
                      Selected ({selectedMediaItems.length}/{maxImages})
                    </Label>
                    {selectedMediaItems.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMediaItems([]);
                          setSelectedMediaIds([]);
                        }}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="whitespace-nowrap h-16">
                    <div className="flex gap-2 items-center">
                      {selectedMediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative group inline-block"
                        >
                          <div className="h-12 w-12 border rounded-md overflow-hidden">
                            {item.mimeType.startsWith("image/") ? (
                              <img
                                src={item.url}
                                alt={item.alt || ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-accent">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeSelectedItem(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Tabs
                defaultValue="browse"
                value={uploadTab}
                onValueChange={(v) => setUploadTab(v as "browse" | "upload")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="browse">Browse Library</TabsTrigger>
                  <TabsTrigger value="upload">Upload New</TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="overflow-auto flex-grow">
                  <div className="flex gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search media..."
                        className="pl-8"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                      }}
                      title="Reset search"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg">
                      <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">
                        No media found
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {search
                          ? "Try a different search term"
                          : "Upload your first media item"}
                      </p>
                      {search && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchInput("");
                            setSearch("");
                          }}
                          className="mt-4"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {data.items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all h-32 ${
                            selectedMediaIds.includes(item.id)
                              ? "ring-2 ring-primary"
                              : "hover:border-primary"
                          }`}
                          onClick={() => toggleItemSelection(item)}
                        >
                          {selectedMediaIds.includes(item.id) && (
                            <Badge className="absolute top-2 left-2 z-10">
                              Selected
                            </Badge>
                          )}

                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.url, "_blank");
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>

                          {item.mimeType.startsWith("image/") ? (
                            <div
                              className="h-full w-full bg-cover bg-center flex items-center justify-center"
                              style={{
                                backgroundImage: `url(${item.url})`,
                                backgroundSize: "cover",
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-muted p-2">
                              <div className="text-3xl mb-2">
                                {item.mimeType.startsWith("image/") ? (
                                  <Image />
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs font-medium truncate max-w-full">
                                {item.originalName}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {data && data.total > 0 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(data.total / 20)}
                        onPageChange={(newPage) => {
                          setPage(newPage);
                          // Scroll to top of dialog content
                          const dialogContent =
                            document.querySelector('[role="dialog"]');
                          if (dialogContent) dialogContent.scrollTop = 0;
                        }}
                        siblingCount={1}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="overflow-auto">
                  <div className="grid gap-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver
                          ? "border-primary bg-primary/10"
                          : "border-gray-300"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() =>
                        document.getElementById("multi-media-upload")?.click()
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {selectedFiles.length > 0 ? (
                        <div className="space-y-4">
                          <div className="font-medium">
                            Selected {selectedFiles.length} file
                            {selectedFiles.length > 1 ? "s" : ""}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatFileSize(
                              selectedFiles.reduce(
                                (total, file) => total + file.size,
                                0
                              )
                            )}{" "}
                            total
                          </div>

                          {/* Show previews for the first file if it's an image */}
                          {selectedFiles[0]?.type.startsWith("image/") && (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(selectedFiles[0])}
                                alt="Preview"
                                className="mx-auto max-h-40 rounded"
                              />
                              {selectedFiles.length > 1 && (
                                <p className="text-xs mt-1 text-muted-foreground">
                                  + {selectedFiles.length - 1} more file
                                  {selectedFiles.length > 2 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Show list of file names if not too many */}
                          {selectedFiles.length <= 5 && (
                            <div className="text-left text-sm max-h-20 overflow-y-auto">
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="truncate">
                                  {file.name}
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFiles([]);
                            }}
                          >
                            Clear selection
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm font-medium">
                            Drag & drop or click to select multiple files
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports images, videos, documents, and more
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        id="multi-media-upload"
                        className="hidden"
                        multiple
                        onChange={handleFileChange}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="multi-media-alt">Alt Text</Label>
                      <Input
                        id="multi-media-alt"
                        value={alt}
                        onChange={(e) => setAlt(e.target.value)}
                        placeholder="Alternative text for accessibility"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="multi-media-tags">
                        Tags (comma separated)
                      </Label>
                      <Input
                        id="multi-media-tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="product, banner, logo"
                      />
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0}
                    >
                      {selectedFiles.length > 0
                        ? `Upload ${selectedFiles.length} files`
                        : "Upload"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSelect}
                disabled={selectedMediaItems.length === 0}
              >
                Select{" "}
                {selectedMediaItems.length > 0
                  ? `(${selectedMediaItems.length})`
                  : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Display selected images */}
        {selectedUrls.length > 0 && (
          <div>
            <Label className="block mb-2">
              Selected Images ({selectedUrls.length})
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative group border rounded-md overflow-hidden h-24"
                >
                  <img
                    src={url}
                    alt={`Selected image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newUrls = [...selectedUrls];
                        newUrls.splice(index, 1);
                        onSelect(newUrls);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div
                className="flex items-center justify-center h-24 border border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
                onClick={() => setOpen(true)}
              >
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        {selectedUrls.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No images selected. Click the button above to select images from the
            media library.
          </div>
        )}
      </div>
    </div>
  );
}
