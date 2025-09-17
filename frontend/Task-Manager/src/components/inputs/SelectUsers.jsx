import React, { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import Modal from "../Modal"
import { LuUsers } from "react-icons/lu";
import AvatarGroup from "../AvatarGroup";

const SelectUsers = ({ selectedUsers, setSelectedUsers }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      if (response.data?.length > 0) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const toggleUserSelection = (userId) => {
    setTempSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = () => {
    setSelectedUsers(tempSelectedUsers);
    setIsModalOpen(false);
  };

  const selectedUserAvatars = allUsers
    .filter((user) => selectedUsers.includes(user._id))
    .map((user) => user.profileImageUrl);
  
  useEffect(() => {
    getAllUsers();
  }, []);
  
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setTempSelectedUsers([]);
    }
    return () => {};
  }, [selectedUsers]);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {selectedUserAvatars.length > 0 && (
          <AvatarGroup avatars={selectedUserAvatars} />
        )}

        <button
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm shadow-primary/10 transition hover:border-primary hover:bg-primary/5"
          onClick={() => {
            setTempSelectedUsers(selectedUsers);
            setIsModalOpen(true);
          }}
        >
          <LuUsers className="text-base" />
          {selectedUserAvatars.length > 0 ? "Manage Members" : "Add Members"}
        </button>  
      </div>

      {selectedUserAvatars.length === 0 && (
        <p className="text-xs font-medium text-slate-500">
          No members assigned yet.
        </p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Users"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Choose the team members who will collaborate on this task.
          </p>

          <div className="space-y-3 overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
            {allUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-sm shadow-slate-200/60"
              >
                <img
                  src={user.profileImageUrl}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <input
                  type="checkbox"
                  checked={tempSelectedUsers.includes(user._id)}
                  onChange={() => toggleUserSelection(user._id)}
                  className="h-4 w-4 rounded-sm border-slate-300 text-primary focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90"
            onClick={handleAssign}
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );  
};

export default SelectUsers;
