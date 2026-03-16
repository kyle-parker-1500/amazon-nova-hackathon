from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("VITE_API_KEY")
api_url = os.getenv("VITE_API_URL")


# Load API key & url from .env --> remove when moving to remote server!
client = OpenAI(
    api_key=api_key,
    base_url=api_url
)

app = Flask(__name__)
CORS(app)  # allows your React frontend to call this server

# In-memory conversation store: { conversation_id: [messages] }
conversations = {}


@app.route("/api/chat", methods=["POST"])
def chat():
    body = request.json
    conversation_id = body.get("conversationId")
    user_message = body.get("message")          # plain string from frontend
    system_prompt = body.get("systemPrompt", "You are a helpful assistant.")

    if not conversation_id or not user_message:
        return jsonify({"error": "conversationId and message are required"}), 400

    # Initialize conversation if new
    if conversation_id not in conversations:
        conversations[conversation_id] = [
            {"role": "system", "content": system_prompt}
        ]

    # Append the new user message
    conversations[conversation_id].append({
        "role": "user",
        "content": user_message
    })

    # Call Nova
    response = client.chat.completions.create(
        model="nova-2-lite-v1",
        messages=conversations[conversation_id],
        stream=False
    )

    reply = response.choices[0].message.content

    # Append assistant reply to history
    conversations[conversation_id].append({
        "role": "assistant",
        "content": reply
    })

    return jsonify({
        "reply": reply,
        "conversationId": conversation_id,
        "history": conversations[conversation_id]
    })


@app.route("/api/conversations", methods=["GET"])
def list_conversations():
    """Returns all conversation IDs and their message count."""
    return jsonify({
        cid: len(msgs) for cid, msgs in conversations.items()
    })


@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Clears a conversation's history."""
    conversations.pop(conversation_id, None)
    return jsonify({"deleted": conversation_id})


if __name__ == "__main__":
    app.run(port=3001, debug=True)
