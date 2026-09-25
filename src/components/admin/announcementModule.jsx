import React, {
  useEffect,
  useState,
} from "react";
import { Megaphone } from "lucide-react";
import { supabase } from "../../lib/supabase";

import {
  Field,
  inputClass,
  Modal,
  RowActions,
  SectionHeader,
} from "./adminUI";

function getAnnouncementImageUrl(imagePath) {
  if (!imagePath) return "";

  const { data } = supabase.storage
    .from("announcement-images")
    .getPublicUrl(imagePath);

  return data?.publicUrl || "";
}

function createImagePath(file) {
  const extension =
    file.name.split(".").pop()?.toLowerCase() ||
    "jpg";

  return `announcements/${crypto.randomUUID()}.${extension}`;
}

function formatDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset();

  return new Date(
    date.getTime() - timezoneOffset * 60000,
  )
    .toISOString()
    .slice(0, 16);
}

function AnnouncementForm({
  initialData,
  onCancel,
  onSave,
  saving,
}) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    details: initialData?.details || "",
    expires_at: formatDateTimeLocal(
      initialData?.expires_at,
    ),
    image: null,
  });

  const existingImageUrl = initialData?.image_path
    ? getAnnouncementImageUrl(
        initialData.image_path,
      )
    : "";

  const [imagePreview, setImagePreview] =
    useState(existingImageUrl);

  const [temporaryPreview, setTemporaryPreview] =
    useState("");

  useEffect(() => {
    return () => {
      if (temporaryPreview) {
        URL.revokeObjectURL(temporaryPreview);
      }
    };
  }, [temporaryPreview]);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageChange(event) {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      update("image", null);
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      window.alert(
        "Please select a JPG, PNG, WebP, or GIF image.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert(
        "The image must not be larger than 5 MB.",
      );

      event.target.value = "";
      return;
    }

    if (temporaryPreview) {
      URL.revokeObjectURL(temporaryPreview);
    }

    const previewUrl =
      URL.createObjectURL(file);

    update("image", file);
    setTemporaryPreview(previewUrl);
    setImagePreview(previewUrl);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.details.trim() ||
      !form.expires_at
    ) {
      window.alert(
        "Title, details, and expiration date are required.",
      );

      return;
    }

    const expirationDate = new Date(
      form.expires_at,
    );

    if (
      Number.isNaN(expirationDate.getTime()) ||
      expirationDate <= new Date()
    ) {
      window.alert(
        "The expiration date must be in the future.",
      );

      return;
    }

    onSave(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Field label="Title">
        <input
          className={inputClass}
          value={form.title}
          onChange={(event) =>
            update("title", event.target.value)
          }
          placeholder="Announcement title"
          maxLength={150}
          required
        />
      </Field>

      <Field label="Details">
        <textarea
          className={`${inputClass} min-h-[120px] resize-y`}
          value={form.details}
          onChange={(event) =>
            update("details", event.target.value)
          }
          placeholder="Write the announcement details..."
          required
        />
      </Field>

      <Field label="Expiration date and time">
        <input
          className={inputClass}
          type="datetime-local"
          value={form.expires_at}
          onChange={(event) =>
            update(
              "expires_at",
              event.target.value,
            )
          }
          min={formatDateTimeLocal(new Date())}
          required
        />
      </Field>

      <Field label="Image (optional)">
        <input
          className={inputClass}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleImageChange}
        />

        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, WebP, or GIF. Maximum 5 MB.
        </p>
      </Field>

      {imagePreview && (
        <img
          src={imagePreview}
          alt="Announcement preview"
          className="w-full h-44 object-cover rounded-xl border border-gray-100"
        />
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function AnnouncementModule({
  announcements,
  setAnnouncements,
  loading,
  error,
}) {
  const [modalMode, setModalMode] =
    useState(null);

  const [selected, setSelected] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [actionError, setActionError] =
    useState("");

  function closeModal() {
    if (saving) return;

    setModalMode(null);
    setSelected(null);
    setActionError("");
  }

  async function handleSave(form) {
    setSaving(true);
    setActionError("");

    let newImagePath = null;
    let databaseSaved = false;

    try {
      const expirationDate = new Date(
        form.expires_at,
      );

      if (
        !form.title?.trim() ||
        !form.details?.trim() ||
        Number.isNaN(expirationDate.getTime())
      ) {
        throw new Error(
          "Please complete all required fields.",
        );
      }

      if (expirationDate <= new Date()) {
        throw new Error(
          "The expiration date must be in the future.",
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please log in again.",
        );
      }

      if (form.image) {
        newImagePath = createImagePath(
          form.image,
        );

        const { error: uploadError } =
          await supabase.storage
            .from("announcement-images")
            .upload(
              newImagePath,
              form.image,
              {
                cacheControl: "3600",
                contentType: form.image.type,
                upsert: false,
              },
            );

        if (uploadError) {
          throw new Error(
            `Image upload failed: ${uploadError.message}`,
          );
        }
      }

      const payload = {
        title: form.title.trim(),
        details: form.details.trim(),
        expires_at:
          expirationDate.toISOString(),
      };

      if (modalMode === "edit") {
        if (!selected?.id) {
          throw new Error(
            "No announcement was selected.",
          );
        }

        if (newImagePath) {
          payload.image_path = newImagePath;
        }

        const {
          data,
          error: updateError,
        } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", selected.id)
          .select(`
            id,
            title,
            details,
            image_path,
            expires_at,
            created_by,
            created_at,
            updated_at
          `)
          .single();

        if (updateError) {
          throw updateError;
        }

        databaseSaved = true;

        const updatedAnnouncement = {
          ...data,
          image_url:
            getAnnouncementImageUrl(
              data.image_path,
            ),
        };

        setAnnouncements(
          (currentAnnouncements) =>
            currentAnnouncements.map(
              (announcement) =>
                announcement.id === selected.id
                  ? updatedAnnouncement
                  : announcement,
            ),
        );

        if (
          newImagePath &&
          selected.image_path &&
          selected.image_path !== newImagePath
        ) {
          const {
            error: oldImageDeleteError,
          } = await supabase.storage
            .from("announcement-images")
            .remove([selected.image_path]);

          if (oldImageDeleteError) {
            console.error(
              "Failed to delete the old image:",
              oldImageDeleteError,
            );
          }
        }
      } else {
        const createPayload = {
          ...payload,
          image_path: newImagePath || null,
          created_by: user.id,
        };

        const {
          data,
          error: insertError,
        } = await supabase
          .from("announcements")
          .insert(createPayload)
          .select(`
            id,
            title,
            details,
            image_path,
            expires_at,
            created_by,
            created_at,
            updated_at
          `)
          .single();

        if (insertError) {
          throw insertError;
        }

        databaseSaved = true;

        const newAnnouncement = {
          ...data,
          image_url:
            getAnnouncementImageUrl(
              data.image_path,
            ),
        };

        setAnnouncements(
          (currentAnnouncements) => [
            newAnnouncement,
            ...currentAnnouncements,
          ],
        );
      }

      setModalMode(null);
      setSelected(null);
      setActionError("");
    } catch (saveError) {
      console.error(
        "Failed to save announcement:",
        saveError,
      );

      if (newImagePath && !databaseSaved) {
        const { error: cleanupError } =
          await supabase.storage
            .from("announcement-images")
            .remove([newImagePath]);

        if (cleanupError) {
          console.error(
            "Failed to clean up image:",
            cleanupError,
          );
        }
      }

      setActionError(
        saveError.message ||
          "Unable to save the announcement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(announcement) {
    const confirmed = window.confirm(
      `Delete announcement "${announcement.title}"?`,
    );

    if (!confirmed) return;

    setDeletingId(announcement.id);
    setActionError("");

    try {
      const { error: deleteError } =
        await supabase
          .from("announcements")
          .delete()
          .eq("id", announcement.id);

      if (deleteError) {
        throw deleteError;
      }

      setAnnouncements((current) =>
        current.filter(
          (item) =>
            item.id !== announcement.id,
        ),
      );

      if (announcement.image_path) {
        const {
          error: imageDeleteError,
        } = await supabase.storage
          .from("announcement-images")
          .remove([
            announcement.image_path,
          ]);

        if (imageDeleteError) {
          console.error(
            "Failed to delete image:",
            imageDeleteError,
          );
        }
      }
    } catch (deleteError) {
      console.error(
        "Failed to delete announcement:",
        deleteError,
      );

      setActionError(
        deleteError.message ||
          "Unable to delete the announcement.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Announcements"
        count={announcements.length}
        addLabel="Add Announcement"
        onAdd={() => {
          setSelected(null);
          setActionError("");
          setModalMode("add");
        }}
      />

      {(error || actionError) && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError || error}
        </div>
      )}

      <div className="space-y-4">
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            Loading announcements...
          </div>
        )}

        {!loading &&
          announcements.map(
            (announcement) => {
              const imageUrl =
                announcement.image_url ||
                getAnnouncementImageUrl(
                  announcement.image_path,
                );

              const deleting =
                deletingId === announcement.id;

              return (
                <div
                  key={announcement.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={announcement.title}
                      className="w-full h-52 object-cover"
                    />
                  )}

                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-slate-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {announcement.title}
                        </p>

                        <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
                          {announcement.details}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          Expires:{" "}
                          {new Date(
                            announcement.expires_at,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {deleting ? (
                      <span className="text-xs text-gray-400">
                        Deleting...
                      </span>
                    ) : (
                      <RowActions
                        disabled={saving}
                        onEdit={() => {
                          setSelected(
                            announcement,
                          );

                          setActionError("");
                          setModalMode("edit");
                        }}
                        onDelete={() =>
                          handleDelete(
                            announcement,
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              );
            },
          )}

        {!loading &&
          announcements.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
              No active announcements.
            </div>
          )}
      </div>

      {modalMode && (
        <Modal
          title={
            modalMode === "edit"
              ? "Edit Announcement"
              : "Add Announcement"
          }
          onClose={closeModal}
        >
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          <AnnouncementForm
            initialData={selected}
            onCancel={closeModal}
            onSave={handleSave}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}