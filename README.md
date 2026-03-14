# Minecraft Datapack Copilot

Quickly build functional minecraft datapacks with AWS Nova.

<img width="300" height="300" alt="image" src="https://github.com/user-attachments/assets/e63df606-36e0-42fc-a470-31c7bfc01938" />

## Architecture

```mermaid
flowchart LR

idea[Minecraft Datapack Idea]

copilot[Datapack Copilot]

nova[(Amazon Nova API)]

validator[Datapack Validator]

pack[Validated Datapack]

idea -->|Prompt| copilot
copilot -->|Generate code| nova
nova -->|Model output| copilot
copilot -->|Generated datapack| validator
validator -->|Validation| pack
```

## Roadmap

- [ ] How do we use the AWS Nova API text in text out - @kyle-parker-1500
- [ ] How do we verify the output for the datapack

## Setup

```bash
uv sync
uv run main.py
```

## Validate Datapack

Use `validate.py` to check if a datapack is correct.

Correct datapacks look like this:

<img width="1455" height="904" alt="image" src="https://github.com/user-attachments/assets/bfb3cf0a-9632-4d0d-9933-944b10f12a24" />

Incorrect datapacks look like this:

<img width="1445" height="438" alt="image" src="https://github.com/user-attachments/assets/cae170c6-a383-4ec8-a109-0329f2da98c5" />

## Get API Key

<img width="658" height="761" alt="image" src="https://github.com/user-attachments/assets/0b133605-c7ad-4653-b01e-41b3769a602b" />
