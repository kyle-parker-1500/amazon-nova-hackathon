# Minecraft Datapack Copilot

Quickly build functional minecraft datapacks with [Amazon Nova](https://nova.amazon.com).

<img width="300" height="300" alt="image" src="https://github.com/user-attachments/assets/e63df606-36e0-42fc-a470-31c7bfc01938" />

#### Elevator Pitch:

Use Amazon Nova to build functional minecraft datapacks. It's inaccessible for most Minecraft players to write datapacks by themselves, and this makes it easy!

## Example

![Demo Chat](demo-image.png)

## Technologies

[Amazon Nova](https://nova.amazon.com/) :star:, Python, Vite, React.js, Tailwind

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

- [x] How do we use the AWS Nova API text in text out - @kyle-parker-1500
- [x] How do we verify the output for the datapack - @JakeRoggenbuck
- [x] Chat interface frontend @kyle-parker-1500

## Inspiration

We often want specific Minecraft data packs but weren't sure how to make them until recently. More importantly, it's inaccessible for most Minecraft players to write datapacks by themselves, and this makes it easy!

## What it does

Automatically generate valid Minecraft data packs. Data packs are small configuration files that enable custom gameplay. These data packs can vastly improve game play experience for users, but Minecraft doesn't offer an easy way to build them out for most players.

## How we built it

We used Amazon Nova as the intelligence for generating our data pack information. We then made a server in Python that requested the Amazon Nova API to generate the Minecraft config files needed to make the data packs work.

## Challenges we ran into

Matching an exact specification for what comprises a data pack is difficult. It was also difficult to translate generated code into actions that made file operations. Getting valid syntax is always hard, especially when the spec if not exact.

## Accomplishments that we're proud of

We built a validator that basically fixes the issue with incorrect data pack syntax, because we can feed the validators output of warnings and error into Amazon Nova to make corrections until the data pack is valid. We also made the chat interface very easy to use. Since Amazon Nova is very fast, it's able to help you build out a custom data pack effortlessly.

## What we learned

We learned how to make corrective feedback loops to ensure correctness of LLM output. We also learned how to use the Amazon Nova.

## What's next for Minecraft Datapack Copilot

We plan to generalize this idea to entire mod packages, which have a much larger scope and complexity.

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

## Datapack Chat

![Datapack Chat](datapack-chat-frontend/screenshot.png)
