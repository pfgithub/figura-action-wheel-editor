- [ ] improve the animation condition editor
- [ ] update the layout to be three panels horizontally: Action Wheels, 
- [ ] update actions to have a color picker. 



- [ ] The 'icon' string in Actions is supposed to represent a minecraft item, like `minecraft:stone`. Add a picker to choose from any item in minecraft, and allow manually typing in an item id for if the item isn't found in the picker. To get the images, fetch `/minecraft-items.json`. It will return `Record<string, {id: string, name: string, imageUrl: string}>` which is a map from item ids to names and image urls.
- [ ] Improve the color picker for actions and default it to white
- [ ] Update the UI layout to take up the full page with two vertical columns. On the left is the action wheels editor with tabs for the action wheels on the top and edit action below. On the right is the animation settings panel. The toggle groups section can be removed.
- [ ] Implement an Animation Condition Editor based on drag and drop using dnd-kit and immer
- [ ] Make it so you can drop a 'and', 'or', or 'not' component on another component to wrap that one
- [ ] Make it so if you drag a component to the 'Conditions' sidebar, it deletes it.