import { memo } from "react";
import { extractParenChoiceGroups, stripParenChoiceBlocks } from "../choiceParsing.js";
import { stripOpenClawHiddenBlocks } from "../messageDisplayUtils.js";
import AssistantBubble from "./AssistantBubble.jsx";
import ChoiceCards from "./ChoiceCards.jsx";
import ParenChoiceSelectors from "./ParenChoiceSelectors.jsx";

const AssistantMessageGroup = memo(function AssistantMessageGroup({
  msg,
  isLast,
  isRunning,
  onSelect,
  setInput,
  inputRef,
}) {
  const visibleContent = stripOpenClawHiddenBlocks(msg.content);
  const parenGroups = extractParenChoiceGroups(visibleContent);
  const bubbleText =
    msg.streaming || parenGroups.length === 0
      ? visibleContent
      : stripParenChoiceBlocks(visibleContent);
  const excludeParenNums = new Set(parenGroups.map((g) => g.num));

  const showBubble = msg.streaming || Boolean(bubbleText.trim());

  return (
    <div className="space-y-2">
      {showBubble && (
        <AssistantBubble text={bubbleText} streaming={msg.streaming} />
      )}
      {!msg.streaming && parenGroups.length > 0 && (
        <ParenChoiceSelectors groups={parenGroups} onSelect={onSelect} />
      )}
      {!msg.streaming && !isRunning && isLast && (
        <ChoiceCards
          text={visibleContent}
          onSelect={onSelect}
          setInput={setInput}
          inputRef={inputRef}
          excludeNums={excludeParenNums}
        />
      )}
    </div>
  );
});

export default AssistantMessageGroup;
