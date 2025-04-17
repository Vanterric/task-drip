export default function DeleteTaskListModal({ isOpen, onClose, onConfirm, listName }) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
          <h2 className="text-lg font-semibold text-[#4F5962]">Delete this list?</h2>
          <p className="text-sm text-[#91989E] mt-2">
            This will delete <span className="font-medium text-[#4F5962]">"{listName}"</span> and all its tasks.
          </p>
          <p className="text-sm text-[#DF7C52] mt-1 font-semibold">
            This cannot be undone.
          </p>
  
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={onClose}
              className="text-[#4F5962] px-4 py-2 rounded-lg border border-[#4F596240] hover:bg-[#F6F8FA] transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-[#DF7C52] text-white px-4 py-2 rounded-lg hover:bg-[#c85f3e] transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
  