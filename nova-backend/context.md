## 📦 Creating a Minecraft Data Pack  

Data packs let you **add or modify** many aspects of the game—functions, loot tables, structures, advancements, recipes, tags, dimensions, predicates, and world‑generation logic. Below is a step‑by‑step guide to set up a new pack, write its metadata, and start adding content.

---

### 📁 Folder Structure  

A data pack must follow a specific hierarchy:

```
<data‑pack‑name>/
├─ pack.mcmeta          ← mandatory metadata file
├─ pack.png             ← optional icon displayed in‑game
└─ data/
    └─ <namespace>/     ← one folder per namespace you use
        ├─ function/     ← .mcfunction files
        ├─ loot_table/   ← .json loot tables
        ├─ structure/    ← .nbt structures
        ├─ worldgen/     ← world‑generation definitions
        ├─ advancement/   ← .json advancements
        ├─ enchantment/   ← .json enchantment definitions
        ├─ recipe/       ← .json recipes (formerly recipes/)
        ├─ tag/          ← .json tags (block, item, function)
        └─ predicate/     ← .json predicates
```

> **Tip:** Running `/datapack create <id> <description>` in‑game will generate the basic skeleton for you.

---

### ✏️ Creating `pack.mcmeta`  

1. **Make the file** – Right‑click inside the pack folder, choose *New → Text Document*, and rename it **pack.mcmeta** (ensure the `.mcmeta` extension, not `.txt`).  
2. **Turn on file extensions** if they’re hidden:  
   - **Windows 11:** *View → Show → File name extensions*.  
   - **Windows 10:** *View → Check “File name extensions”*.  
   - **Older Windows:** Uncheck “Hide extensions for known file types”.  

#### 📄 Formatting `pack.mcmeta`  

Open the file with any text editor and paste the following JSON:

```json
{
    "pack": {
        "description": "This is the description of your data pack",
        "min_format": 88,
        "max_format": 88
    }
}
```

- **`description`** – Any string (or raw JSON text) that appears when you hover the pack in‑game.  
- **`min_format` / `max_format`** – Define the inclusive range of pack‑format versions the pack supports. In this example both are set to **88**, matching the latest stable release.  

> **⚠️** Brackets `{}` and commas `,` must be exact; a missing character will prevent the pack from loading.

---

### 🖼️ Pack Icon (Optional)  

Place a file named **pack.png** in the root of the pack. Requirements:  

- PNG format.  
- Square aspect ratio (1:1).  
- Recommended size **128 × 128 px** (Mojang’s default).  

If no icon is supplied, the game shows a generic cobblestone block.

---

### 🔍 Testing Your Pack  

1. **Load the world** (or start a new one).  
2. In‑game, type `/reload` to refresh data packs.  
3. Run `/datapack list`. You should see an entry like `[file/(your‑pack‑name) (world)]`.  
4. Hovering over the entry will display the description you wrote in `pack.mcmeta`.  

If the pack does not appear, double‑check that `pack.mcmeta` is correctly formatted and saved with the proper extension.

---

### 🛠️ Adding Content to Your Pack  

#### 📦 Naming & Namespaces  

All resources use a **resource location** of the form `namespace:path`.  
- Create a folder named after your **namespace** inside `data/`.  
- Use only lowercase letters, digits, underscores `_`, hyphens `-`, periods `.`, and forward slashes `/` (not in the namespace).  

Example: `data:my_namespace:function/door_toggle.mcfunction` → `my_namespace:door_toggle`.

#### 📜 Functions  

1. Inside your namespace folder, make a `function/` directory.  
2. Add `.mcfunction` files here or in subfolders.  
3. The game reads them as `namespace:function_name` or `namespace:subfolder/function_name`.

#### 🎁 Loot Tables  

- Folder: `loot_table/`.  
- File name: `<name>.json`.  
- Example: `data/my_mod/loot_table/cow.json` defines the cow’s drops.

#### 🏗️ Structures  

- Folder: `structure/`.  
- Store `.nbt` files here.  
- Loaded with `/structure load <namespace>:<name>`.

#### 🌍 World Generation  

- Folder: `worldgen/`.  
- Place noise‑settings or other generation files.  
- Affects how terrain and features generate.

#### 🏆 Advancements  

- Folder: `advancement/`.  
- `.json` files define criteria and rewards.  
- Example: `data/my_mod/advancement/first_kill.json`.

#### ✨ Enchantments  

- Folder: `enchantment/`.  
- JSON defines enchantment properties and levels.  
- Register via the `enchantment` registry.

#### 🔨 Recipes  

- Folder: `recipe/` (formerly `recipes/`).  
- JSON files specify shaped, shapeless, smelting, or smithing recipes.  
- Example: `data/my_mod/recipe/diamond_sword.json`.

#### 🏷️ Tags  

- Inside `tag/` create `block/`, `item/`, or `function/` subfolders.  
- JSON files group resources (e.g., `#my_mod:planks`).  
- Useful for `/tag` commands and recipe ingredients.

#### 📊 Predicates  

- Folder: `predicate/`.  
- JSON files describe conditions for loot tables, `/execute if predicate`, etc.

#### 🌌 Dimensions  

- Folder: `dimension/`.  
- JSON defines custom dimension properties.  
- Accessed via `/execute in <namespace>:<dim>`.

---

### 🛠️ Utilities for Data‑Pack Development  

| Category | Tool | Platform | Description | Latest Version |
|----------|------|----------|-------------|----------------|
| Syntax Highlighting / IDE Support | **syntax‑mcfunction** | VS Code, Sublime Text | Syntax coloring for `.mcfunction` files | 1.21.7+ |
| | **Datapack Helper Plus** | VS Code | Full language features for all data‑pack files | 1.21.10 |
| | **Datapack Icons** | VS Code | Minecraft‑styled icons for datapack projects | 1.21.3+ |
| | **Minecraft Command DevKit** | IntelliJ IDEA | Debugging tools for mcfunctions | 1.21.5 |
| | **MCFunction.xml** | Notepad++ | Syntax highlighting for mcfunction | 1.13.3 |
| Transpilers / Frameworks | **Beet** | Python | Pack dev kit + transpiler | 1.21.6+ |
| | **MC‑build** | — | Pre‑compiler language for data packs | 1.21.3 |
| | **Sandstone** | TypeScript | Library for datapack creation | 1.20.6 |
| | **TMS Transpiler** | Python | Indented mcfunction → valid files | 1.21.3 |
| | **ObjD** | Dart | Framework to reduce repetitive code | 1.20.4 |
| | **Minity** | Node.js | Scripting language compiling to packs | 1.18 |
| | **Minecraft Script** | Node.js | JavaScript‑like language → datapacks | 1.13.3 |
| | **Kore** | Kotlin | Modern, type‑safe library | 1.21.10 |
| Visual Generators | **MCreator** | Program | GUI for creating packs and mods | 1.21.4 |
| | **Misode’s Data Pack Generators** | Website | JSON generators for various pack components | 1.21.11 |
| | **MCStacker** | Website | Collection of command generators | 1.21.11 |
| | **Datapack‑Editor** | Program | Offline IDE for pack creation & validation | 1.20.6 |
| | **MCDatapacker** | Program | Offline editor for packs | 1.20.4 |
| | **NBTData Pack Generator** | Website | Generates raw data‑pack framework | 1.20.2 |
| | **Minecraft Recipe Generator** | Website | Generates custom recipe JSON | 1.20.1 |
| | **Recipe Generator** | Website | Crafting recipe JSON generator | 1.20 |
| | **Datapack Creator** | Program | IDE with helper tools | 1.17 |
| | **Minecraft Tools Recipe Generator** | Website | Crafting JSON generator | 1.12 |
| | **Origin Creator** | Website | Full‑featured web tool for packs | Unknown |

These tools can speed up development, but always verify that any third‑party software is safe before installation.

---

### ✅ Quick Checklist Before Publishing  

- ✅ `pack.mcmeta` present and correctly formatted.  
- ✅ All resource files use the right naming conventions (`lowercase_with_underscores`).  
- ✅ Namespaces are unique to avoid conflicts.  
- ✅ Pack icon `pack.png` (optional) meets size/aspect‑ratio requirements.  
- ✅ Test in‑game with `/reload` and `/datapack list`.  
- ✅ Review any error messages for missing braces, commas, or incorrect JSON syntax.  

With this foundation you can now expand your pack with functions, loot tables, structures, and more—customizing Minecraft to suit your ideas! 🎮✨
