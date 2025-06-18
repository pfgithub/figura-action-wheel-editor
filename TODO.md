- [x] The 'icon' string in Actions is supposed to represent a minecraft item, like `minecraft:stone`. Add a picker to choose from any item in minecraft, and allow manually typing in an item id for if the item isn't found in the picker. To get the images, fetch `/minecraft-items.json`. It will return `Record<string, {id: string, name: string, imageUrl: string}>` which is a map from item ids to names and image urls.
- [ ] Improve the color picker for actions and default it to white
- [x] Update the UI layout to take up the full page with two vertical columns. On the left is the action wheels editor with tabs for the action wheels on the top and edit action below. On the right is the animation settings panel. The toggle groups section can be removed.
- [x] Implement an Animation Condition Editor based on drag and drop using dnd-kit and immer
- [ ] Make it so you can drop a 'and', 'or', or 'not' component on another component to wrap that one
- [ ] Make it so if you drag a component to the 'Conditions' sidebar, it deletes it.
- [x] 'effect' in Action is now optional, and so is toggleGroup and value in ActionEffect and AnimationConditionToggleGroup, switchPage in ActionWheel, and player in AnimationConditionPlayer. Update the UI to have these null by default.
- [ ] migrate the code to use a state manager and add undo/redo, or global context and immer
- [ ] add support for showing/hiding model elements (ie hide head when `not (renderer:isFirstPerson() and context == "OTHER"`))
- [ ] add a section where you can add custom code to your render fn and then use variables from it in conditions
- [ ] add vanilla_model.PLAYER for setVisible and add false
- [ ] add support for setting eye offsets and camera pivot offsets
- [ ] switch alert()/confirm() for toasts and dialogs
- [ ] migrate useMinecraftItems to tanstack query
- [ ] split AnimationConditionEditor into multiple files
- [ ] add the ability to drag and drop reorder items in the action wheel
- [ ] update the animation settings panel so it has a list of animations and you can select them and then there's a seperate panel below it where you can set the name and activation conditions for the selected one
- [ ] AnimationConditionEditor.tsx : make it easier to use
- [x] Currently, the project is loaded from the server and saved to the server. Change this. Instead, when you open the app it should be empty and have a drop area to choose files. You drop project.json and then the it opens the app. The save button now downloads the new project.json.
- [x] (context: types.ts, bbmodel.ts, App.tsx, avatarStore.tsx) Currently, the 'Avatar' type contains 'animations: AnimationID[]'. Instead of having animations here, the animations need to be loaded from '.bbmodel' files. When you open the page, it should ask you to drop all your avatar's bbmodel files and your project json. To get all the animation IDs, loop over each bbmodel file's animations and concatenate the name of the file + "." + the animation name.
- [ ] In AnimationSettingsManager, instead of 'Error: Missing setting for animation ID', have it still show the editor. If there is an animation setting for an animation id that isn't found, still show the setting but put a warning on it. Also, remove the 'name' option from AnimationSetting.
- [ ] Migrate to headlessui
- [ ] The whole app has undo and redo, so there is no need for "This action cannot be undone" dialogs.
- [ ] In the animation settings panel, show each animation that doesn't have a setting for it in the list so you can easily add one. Also, add a button to prompt for manually entering an animation id if you need to.
- [ ] Add an info button next to toggle groups that describes what toggle groups are
- [ ] The animationSettings are changing. Instead of only animations, now there are three types of settings:
  - Play Animation (plays when the condition is true).
    - Same as before
  - Hide Element (hides when the condition is true)
    - To get the list of elements, use the outliner tree in the BBModel
    - For the IDs, an example is `models.theModelName.Character.Head.Hat`
  - Hide Player (hides when the condition is true)
    - There is only one player
  Implement the change.
- [x] Add new conditions:
  - Render Context: FIRST_PERSON or PAPERDOLL, or OTHER
  - Renderer: isFirstPerson, isCameraBackwards
  For HidePlayerSetting, add an option "Part" which is one of [
    "ALL",
    "PLAYER",
    "OUTER_LAYER",
    "INNER_LAYER"
  ]
  - Add a new settings ForcePaperdoll (force paperdoll when condition is true), HideCrosshair (hide crosshair when condition is true), HideVehicle (hide vehicle when condition is true), and UpsideDown (flip upside down when condition is true)
  - The 'Hide Player' tab should be renamed to the 'Render' tab and all the new settings should go in there
- [ ] Mix the 'configured' and 'unconfigured' render settings
- [x] Add ConditionAnimation with animation: AnimationID and mode: "STOPPED" | "PAUSED" | "PLAYING" that lets you check what state an animation is in
- [x] Add a ConditionCustom that lets you input a lua expression, for example `player:getEyeY() > 60` 
- [x] Update Action so you can choose between an item or texture icon. An item icon is the current behaviour. A texture icon lets you pick one of the image files that you uploaded in the file dropzone and configure (u = 0, v = 0, width = image.width, height = image.height, scale = 1) by selecting the part of the image you want.
- [ ] new way of doing animations:
  - add 'play animation' as an action for a radial menu item
  - add animation groups
  - if three animations are in a group and you play one it stops the other two
  - the button is toggled on while the animation is playing. if you start an animation in a group,
    it stops all other animations in that group.
  - if you have an animation used in an action, you can't set conditions for it
  - wonder how to integrate this
- [ ] need to let you have unsit animation. so like sit -> unsit
  - it's the graph in unity. so annoying.
  - stupid layer system or whatever
  - we can make camera pivot work properly though
  - have to think it through
- [ ] add lua library config support:
  - a library can define settings with a comment and you can configure it
  - we can have some default libraries you can add and configure
- [x] add support for reordering actions within an action wheel and moving actions between action wheels
- [ ] add a code editor tab where you can write custom code. you can add parameters.
- [ ] right now, a ScriptDataInstanceType with mode "one" can have zero instances! Fix the app to always have one instance of a ScriptDataInstanceType with mode "one".
- [ ] apply prettier to all source files
- [ ] find which files are largest and split them up
- [ ] migrate the code to use useAvatarStore() rather than passing props down when it makes sense
- [ ] Combine the 'switch wheel' and 'script wheel' tabs.
- [x] split up AnimationConditionEditor into multiple files
  - it's always breaking that one
  - three times it has omitted
    ```
    const activeId = active.id as string;
    const overId = over.id as string;
    ```
    causing an error when activeId is not defined
- [ ] start running typechecking
- [ ] eslint react checks - it loves to add unsafe early returns before a hook
- [x] add keybinds. a keybind has a user-selected name and a Key ID. The list of key ids can be imported from `@/data/KeybindsList.json` and it is of type `{name: string, id: string}[]`. Keybinds can be configured to run Actions.
- [ ] make avatar non-optional in useAvatarStore
- [ ] make a component for each condition node
- [ ] modify the action wheels and conditional settings tabs to be like scripts and keybinds with the list on the left and the editor on the right
- [ ] switch the action wheels page to have tabs for the action wheels, wheel on the left, and edit on the right
- [ ] add an avatar metadata editor (needs a seperate save :/)
- [ ] check what happens with external image files in blockbench
- [ ] replace 'script action wheel' with 'script action'
- [ ] add 'play animation' action but only for animations which are run_once. loop and hold animations go through the settings system.
- [ ] add 'always' and 'never' in the 
- [ ] add multi-action support
- [ ] add sound action (need to look at ogg files)
- [ ] (repeatable) Determine what part of the code is most in need of refactoring and refactor it.

Output the list of created/modified/deleted files with the full updated content for each file (or if it's deleted, just the filename).

If changes need to me made to files not included in the context, describe how to refactor them.

