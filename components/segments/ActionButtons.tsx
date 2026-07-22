"use client";

type ActionButtonsProps = {
  editing: boolean;
  downloading: boolean;

  onSave: () => void;
  onCancel: () => void;

  onDownload: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

export default function ActionButtons({
  editing,
  downloading,

  onSave,
  onCancel,

  onDownload,
  onEdit,
  onRemove,

}: ActionButtonsProps) {


  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
      }}

      onClick={(e)=>e.stopPropagation()}
    >


      {editing ? (

        <>
          <button
            title="Save"
            onClick={onSave}
          >
            💾
          </button>


          <button
            title="Cancel"
            onClick={onCancel}
          >
            ❌
          </button>
        </>


      ) : (

        <>

          <button
            title="Download"
            disabled={downloading}
            onClick={onDownload}
          >
            {
              downloading
              ? "..."
              : "📥"
            }
          </button>


          <button
            title="Edit"
            onClick={onEdit}
          >
            ✏️
          </button>


          <button
            title="Delete"
            onClick={onRemove}
          >
            🗑️
          </button>

        </>

      )}

    </div>
  );
}