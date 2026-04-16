import { memo } from "react";

const UserBubble = memo(function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-[13px] leading-relaxed text-white">
        {text}
      </div>
    </div>
  );
});

export default UserBubble;
