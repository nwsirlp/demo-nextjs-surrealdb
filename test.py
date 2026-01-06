from openai import OpenAI

client = OpenAI(
    api_key="sk-NdjwJAxkTlcjWbOH3otMMa0HraiPWe7flFR6y446WxWMlWzA",
    base_url="https://api.opentyphoon.ai/v1"
)

response = client.chat.completions.create(
    model="typhoon-v2.1-12b-instruct",
    messages=[{"role": "user", "content": "Hello"}]
)

print(response)