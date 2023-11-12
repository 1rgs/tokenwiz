// src/App.tsx
import React, { useCallback, useEffect, useState } from "react";
// add app.css
import "./App.css";
import debounce from "lodash.debounce";

const COLORS = [
  "rgba(107,64,216,.3)",
  "rgba(104,222,122,.4)",
  "rgba(244,172,54,.4)",
  "rgba(239,65,70,.4)",
  "rgba(39,181,234,.4)",
];

const EXAMPLE_TEXT =
  "Many words map to one token, but some don't: indivisible.\n\nUnicode characters like emojis may be split into many tokens containing the underlying bytes: 🤚🏾\n\nSequences of characters commonly found next to each other may be grouped together: 1234567890";

const App: React.FC = () => {
  const [enteredText, setEnteredText] = useState<string>(EXAMPLE_TEXT);
  const [tokenizedText, setTokenizedText] = useState<string>("");

  const [tokenizerName, setTokenizerName] = useState<string>(
    "meta-llama/Llama-2-7b-chat-hf"
  );
  const [tokens, setTokens] = useState<
    | [number, [number, number]][]
    | {
        error: string;
      }
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const handleTokenization = useCallback(
    async (text: string, tokenizerName: string) => {
      if (!text || !tokenizerName) {
        return;
      }
      setLoading(true);
      const response = await fetch(
        "https://calderajs--tokenizer-fastapi-app.modal.run/tokenize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            tokenizer_name: tokenizerName,
          }),
        }
      );

      const data = await response.json();

      setLoading(false);
      setTokens(data);
      setTokenizedText(text);
    },
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounced = useCallback(debounce(handleTokenization, 500), []);

  useEffect(() => {
    debounced(enteredText, tokenizerName);
  }, [debounced, enteredText, tokenizerName]);

  const handleClear = () => {
    setEnteredText("");
  };

  const handleExample = () => {
    setEnteredText(EXAMPLE_TEXT);
  };

  const [mode, setMode] = useState<"text" | "token_ids">("text");
  return (
    <div className="flex flex-col mx-auto max-w-xl">
      <h2 className="text-2xl font-bold pb-4">Tokenwiz</h2>

      <p className="pb-4">Huggingface Tokenizer Visualizer</p>

      <label htmlFor="tokenizerName" className="font-bold">
        Tokenizer
      </label>

      <input
        id="tokenizerName"
        type="text"
        value={tokenizerName}
        onChange={(e) => setTokenizerName(e.target.value)}
        placeholder="Enter tokenizer name"
        className="bg-gray-100 py-1 px-2 rounded-md text-sm  mt-2 mb-4"
      />

      {"error" in tokens && (
        <div className="text-red-500 font-xs font-bold pb-4">
          {tokens.error}
        </div>
      )}

      <textarea
        className="border-2 border-gray-300 rounded-md w-full h-32 p-2"
        value={enteredText}
        onChange={(e) => setEnteredText(e.target.value)}
        placeholder="Enter some text"
      />

      <div className="flex items-center mt-4 gap-1 w-96">
        <button
          className="bg-gray-200 hover:bg-gray-300 font-bold py-1 px-2 rounded text-sm"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          className={`bg-gray-200 ${
            enteredText !== EXAMPLE_TEXT ? "hover:bg-gray-300" : ""
          } font-bold py-1 px-2 rounded-md text-sm disabled:opacity-50`}
          onClick={handleExample}
          disabled={enteredText === EXAMPLE_TEXT}
        >
          Show Example
        </button>
      </div>

      <div className={`${loading ? "opacity-60" : ""}`}>
        <div className="grid grid-cols-2 pt-8 gap-1">
          <div className="font-bold">Tokens</div>
          <div className="font-bold">Characters</div>
          <div>{"error" in tokens ? 0 : tokens.length}</div>
          <div>{enteredText.length}</div>
        </div>

        {!("error" in tokens) && tokens.length > 0 && (
          <div className="p-2 bg-gray-100 rounded-md mt-4 whitespace-pre-wrap">
            {mode === "text" ? (
              tokens.map((token, index) => (
                <Token
                  key={index}
                  token={token}
                  index={index}
                  text={tokenizedText}
                />
              ))
            ) : (
              <div>[{tokens.map((token) => token[0]).join(", ")}]</div>
            )}

            <div className="flex items-center mt-4 gap-1 w-96">
              <button
                className={`hover:bg-gray-300 font-bold py-1 px-2 rounded-md text-sm ${
                  mode === "text" ? "bg-gray-200" : "bg-gray-100"
                }`}
                onClick={() => setMode("text")}
              >
                Text
              </button>
              <button
                className={`hover:bg-gray-300 font-bold py-1 px-2 rounded-md text-sm ${
                  mode === "token_ids" ? "bg-gray-200" : "bg-gray-100"
                }`}
                onClick={() => setMode("token_ids")}
              >
                Token IDs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Token: React.FC<{
  token: [number, [number, number]];
  index: number;
  text: string;
}> = ({ text, token, index }) => {
  return (
    <span
      style={{ backgroundColor: COLORS[index % COLORS.length] }}
      key={index}
    >
      {text.slice(token[1][0], token[1][1])}
    </span>
  );
};

export default App;
