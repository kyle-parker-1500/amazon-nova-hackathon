from openai import OpenAI

try:
    with open("./key.secret", 'r') as file:
        api_key = file.read().strip()
except FileNotFoundError:
    print("File not found.")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.nova.amazon.com/v1"
)

response = client.chat.completions.create(
    model="nova-2-lite-v1",
    messages=[{
            "role": "system",
            "content": "You are a helpful assistant"
        },
        {
            "role": "user",
            "content": "Hello! How are you?"
        },
    ],
    stream=False
)

print(response.choices[0].message.content)
