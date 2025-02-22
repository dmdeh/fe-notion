import styled from "styled-components";
import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "../utils/debounce";
import { useParams } from "react-router-dom";
import { createBlock, deleteData } from "../services/api";
import BlockList from "./BlockList";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { HolderOutlined } from "@ant-design/icons";
import SocketIO, { socket } from "./SocketIO";
import { useGetPage } from "../hooks/usePage";
import usePatchBlockData from "../hooks/usePatchBlockData";
import { usePatchNewTitle } from "../hooks/usePatchNewTitle";

export interface Block {
  type: string;
  content: string;
  _id?: string;
  index: number;
  children: Block[];
}

function ArticleLayout() {
  const { id } = useParams<{ id: string }>();
  const pageId = id ?? "";

  const updateNewTitle = usePatchNewTitle(pageId);
  const updateBlock = usePatchBlockData(pageId);

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const { data: pageData } = useGetPage(`pages/${pageId}`);
  const cursorPositionRef = useRef<{ node: Node; offset: number } | null>(null);

  // 커서 위치 저장 함수
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPositionRef.current = {
        node: range.endContainer,
        offset: range.endOffset,
      };
    }
  };

  // 커서 위치 복원 함수
  const restoreCursorPosition = () => {
    const selection = window.getSelection();
    const cursorPosition = cursorPositionRef.current;
    if (selection && cursorPosition) {
      const range = document.createRange();
      range.setStart(cursorPosition.node, cursorPosition.offset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const saveTitle = useCallback(
    debounce((newTitle: string) => {
      updateNewTitle({ newTitle });
      socket.emit("title_updated", { pageId, newTitle });
    }, 500), // 일단 사이드바에 거의 실시간으로 반영되게 하려고 0.5초로.
    []
  );

  const handleTitleChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newTitle = e.currentTarget.innerText;
    saveCursorPosition();
    saveTitle(newTitle);
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key == "Enter") {
      e.preventDefault();
      await handleKeyDown(e, -1);
    }
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      try {
        const { data: newBlock } = await createBlock(pageId!, index + 1);
        const updatedBlocks = [
          ...blocks.slice(0, index + 1),
          { ...newBlock, index: index + 1 },
          ...blocks.slice(index + 1).map((block) => ({
            ...block,
            index: block.index + 1,
          })),
        ];

        setBlocks(updatedBlocks);

        updateBlock({ type: "order", newData: updatedBlocks });
        socket.emit("block_updated", { pageId, blocks: updatedBlocks });
      } catch (error) {
        console.error("블록 생성에 문제가 발생했습니다:", error);
      }
    } else if (e.key === "Backspace" && blocks[index].content === "") {
      e.preventDefault();

      if (blocks.length > 1) {
        const blockToDelete = blocks[index];

        try {
          await deleteData(`pages/${pageId}/blocks/${blockToDelete._id}`);
          const updatedBlocks = [
            ...blocks.slice(0, index),
            ...blocks.slice(index + 1),
          ].map((block) => ({ ...block, index: block.index - 1 }));

          setBlocks(updatedBlocks);

          updateBlock({ type: "order", newData: updatedBlocks });
          socket.emit("block_updated", { pageId, blocks: updatedBlocks });
        } catch (error) {
          console.error("블록 삭제에 문제가 발생했습니다:", error);
        }
      }
    }
  };

  const saveBlock = useCallback(
    debounce((blockId: string = "", newContent: string) => {
      socket.emit("block_content_updated", { pageId, blockId, newContent }); // 소켓 블록 업데이트 전송
      updateBlock({ type: "content", blockId, newData: newContent });
    }, 1000),
    [pageId]
  );

  const handleInput = (e: React.FormEvent<HTMLDivElement>, index: number) => {
    const newContent = e.currentTarget.innerText;
    const updatedBlocks = [...blocks];
    updatedBlocks[index].content = newContent;
    const blockId = updatedBlocks[index]._id;

    saveCursorPosition();
    saveBlock(blockId, newContent);
  };

  const reorder = (list: Block[], startIndex: number, endIndex: number) => {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result.map((block, idx) => ({ ...block, index: idx }));
  };

  const handleUpdateBlockOrder = async (blocks: Block[]) => {
    socket.emit("block_updated", { pageId, blocks }); // 소켓 블록(순서) 업데이트 전송
    updateBlock({ type: "order", newData: blocks });
  };

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reorderedBlocks = reorder(
      blocks,
      result.source.index,
      result.destination.index
    );
    setBlocks(reorderedBlocks);
    handleUpdateBlockOrder(reorderedBlocks);
  };

  useEffect(() => {
    if (pageData) {
      setTitle(pageData.title);
      setBlocks(pageData.blocklist);
    }
  }, [pageId, pageData]);

  useEffect(() => {
    restoreCursorPosition();
  });

  return (
    <Wrapper>
      <SocketIO
        pageId={pageId}
        onBlockUpdate={(updatedBlocks) => setBlocks(updatedBlocks)}
        onTitleUpdate={(newTitle) => setTitle(newTitle)}
      />
      <StyledTitleBox
        contentEditable
        suppressContentEditableWarning
        aria-placeholder="제목없음"
        onInput={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
      >
        {title}
      </StyledTitleBox>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <StyledContentBox
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {blocks.map((block, index) => (
                <Draggable
                  key={index}
                  draggableId={String(index)}
                  index={index}
                >
                  {(provided) => (
                    <StyledBlockBox
                      {...provided.draggableProps}
                      ref={provided.innerRef}
                    >
                      <StyledHolderOutlined {...provided.dragHandleProps} />
                      <BlockList
                        key={block._id}
                        block={block}
                        index={index}
                        handleKeyDown={(e) => handleKeyDown(e, index)}
                        handleInput={handleInput}
                      />
                    </StyledBlockBox>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </StyledContentBox>
          )}
        </Droppable>
      </DragDropContext>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding-left: 100px;
  padding-right: 100px;
  flex-grow: 1;
  min-width: 700px;
`;

const StyledTitleBox = styled.h1`
  width: 100%;
  max-width: 900px;
  height: 60px;
  margin-top: 100px;
  display: flex;
  align-items: center;
  margin-left: 15px;
  &:empty:before {
    content: attr(aria-placeholder);
    color: gray;
  }
`;

const StyledContentBox = styled.div`
  max-width: 100%;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  font-size: 16px;
  line-height: 1.5;
  width: 100%;
`;

const StyledHolderOutlined = styled(HolderOutlined)`
  visibility: hidden;
  color: #aeaeae;
`;

const StyledBlockBox = styled.div`
  width: 100%;
  display: flex;
  &:hover {
    ${StyledHolderOutlined} {
      visibility: visible;
    }
  }
`;

export default ArticleLayout;
