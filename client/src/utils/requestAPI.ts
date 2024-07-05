const server = import.meta.env.VITE_SERVER_URL;

interface RequestOptions {
  method: string;
  headers: {
    "Content-Type": string;
  };
  body?: string;
}

const requestAPI = async (endpoint: string, method = "GET", data?: object) => {
  const options: RequestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${server}/${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (method !== "DELETE") {
    return await response.json();
  }
};

export default requestAPI;
