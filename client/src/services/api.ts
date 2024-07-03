import requestAPI from "../utils/requestAPI";

const server = import.meta.env.VITE_SERVER_URL;

export interface NewPageData {
  title: string;
  blocklist: [];
  parent_id: string;
}

interface NewBlockData {
  type: string;
  content: string;
  index?: number;
  children?: unknown[];
}

export type DataType = NewPageData | NewBlockData;

/**
 *
 * @param endpoint
 * @param newData
 * @url ${server}/${endpoint}
 */

export const updateData = async (endpoint: string, newData: object) => {
  try {
    const response = await fetch(`${server}/${endpoint}`, {
      method: "PATCH",
      body: JSON.stringify(newData), // { title: newTitle } 이런식으로 사용
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Success:", newData, data);
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 *
 * @param endpoint
 * @url ${server}/${endpoint}
 */

export const deleteData = async (endpoint: string) => {
  try {
    const response = await fetch(`${server}/${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("delete 실패!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 *
 * @param pageId
 * @param index
 * @url ${server}/pages/${pageId}/blocks
 */

export const createBlock = async (pageId: string, index: number) => {
  try {
    const response = await fetch(`${server}/pages/${pageId}/blocks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "p",
        content: "",
        index: index,
        children: [],
      }),
    });

    if (!response.ok) {
      throw new Error("실패 !");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to create block:", error);
    throw error;
  }
};
export { requestAPI };
