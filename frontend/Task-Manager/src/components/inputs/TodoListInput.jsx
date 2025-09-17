import React, { useState } from 'react';
import { HiMiniPlus, HiOutlineTrash } from "react-icons/hi2";

const TodoListInput = ({ todoList, setTodoList }) => {
  const [option, setOption] = useState("");

  const handleAddOption = () => {
    if (option.trim()) {
      setTodoList([...todoList, option.trim()]);
      setOption("");
    }
  };

  const handleDeleteOption = (index) => {
    const updatedArr = todoList.filter((_, idx) => idx !== index);
    setTodoList(updatedArr);
  };


  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-3">   
        {todoList.map((item, index) => (
            <div
            key={item}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/70"
          >
            <p className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                {index < 9 ? `0${index + 1}` : index + 1}
                </span>
                {item}
            </p>

            <button
                 className="rounded-full bg-rose-50 p-2 text-rose-500 transition hover:bg-rose-100"
                 onClick={() => handleDeleteOption(index)}
               >
                 <HiOutlineTrash className="text-lg" />
               </button>
             </div>
           ))}
         </div>
   
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
           <div className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
             <input
               type="text"
               placeholder="Enter task name"
               value={option}
               onChange={({ target }) => setOption(target.value)}
               className="w-full text-sm text-slate-700 outline-none placeholder:text-slate-400"
             />
           </div>
           <button
             className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90"
             onClick={handleAddOption}
           >
             <HiMiniPlus className="text-lg" /> Add
           </button>
         </div>
       </div>
     );
   };
export default TodoListInput;
