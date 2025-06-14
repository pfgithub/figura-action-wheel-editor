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

Output the list of created/modified/deleted files with the full content for each file