from modal import Image, Stub, asgi_app, Secret
import os

image = Image.debian_slim().pip_install(
    "transformers",
    "torch",
    "pydantic",
    "fastapi",
    "sentencepiece",
)

stub = Stub(name="tokenizer", image=image)


@stub.function(
    container_idle_timeout=600,
    timeout=20 * 60,
    secret=Secret.from_name("tokenwiz"),
)
@asgi_app()
def fastapi_app():
    from pydantic import BaseModel
    from fastapi import FastAPI
    from fastapi.middleware.cors import (
        CORSMiddleware,
    )

    from transformers import AutoTokenizer

    class TokenizeRequest(BaseModel):
        text: str
        tokenizer_name: str

    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )

    @app.post("/tokenize")
    async def generate(request: TokenizeRequest):
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                request.tokenizer_name, token=os.environ["HUGGINGFACE_TOKEN"]
            )

            tokenized_output = tokenizer(request.text, return_offsets_mapping=True)

            input_ids = tokenized_output["input_ids"]
            offset_mapping = tokenized_output["offset_mapping"]
            return list(zip(input_ids, offset_mapping))

        except Exception as e:
            return {"error": str(e)}

    return app
