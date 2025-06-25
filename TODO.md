# consider

- how will we allow lua files to define their ui settings? what will it look like for the lua file?
- check what happens with external image files in blockbench
- animation nodes actually suck. to play the fly anim on creative flight you have to have
  none -> fly (when creative flight), fly -> none (when not creative flight) and imagine if you
  had a few different ones. sucks so much. maybe we can use ezanims for that use case.

# todo

- [ ] Make it so you can drop a 'and', 'or', or 'not' component on another component to wrap that one
- [ ] Make it so if you drag a component to the 'Conditions' sidebar, it deletes it.
- [ ] Migrate to headlessui
- [ ] Add an info button next to toggle groups that describes what toggle groups are
- [ ] make avatar non-optional in useAvatarStore
- [ ] switch the action wheels page to have tabs for the action wheels, wheel on the left, and edit on the right. alt: "redesign the action wheels page"
- [ ] add 'play animation' action should only be for animations which are run_once
- [ ] add 'always' and 'never' in the conditions
- [ ] add multi-action support
- [ ] add sound action (need to look at ogg files)
- [ ] (repeatable) Determine what part of the code is most in need of refactoring and refactor it.
- [ ] split types into one file for types of data that is edited and another file for types of data that is loaded
- [x] move metadata configuration into a modal that you can't close unless you choose to save or discard
- [x] rather than storing animations with id "animations.model.fly" or `animations.model["some string"]`, store them as {model: string, animation: string}. also, rather than storing model parts with id "models.model.part1.part2.part3", store them as {model: string, partPath: string[]}
- [x] on transitions, add the ability for them to run an ActionEffect
- [x] remove animations from the conditional settings tab. don't worry about migrating existing projects.
- [x] rather than draggable nodes for the Animation Nodes view, have it be a list
- [x] add an option in animation transitions for "don't wait for animation to finish". the exact name can be changed.
- [ ] add a preview of activation conditions to the conditional settings tab and on animation transitions
- [x] there is a bug with animation node transitions. when you're editing a transition, none of the options change anything until you close the dialog and open it again.
- try a four-column layout for animation layers
- [ ] add error boundaries
- [x] show the edit transition dialog when you add a transition and move the target dropdown into the edit transition dialog
- [ ] add an ActionEffect type "Toggle Animation"

Output the list of created/modified/deleted files with the full updated content for each file (or if it's deleted, just the filename).

If changes need to me made to files not included in the context, describe how to refactor them.


redoing stuff:

- [ ] Change Action Effects from `effects: ActionEffect[]` to `effect?: ActionEffect`.
- [ ] Add an action type called "Toggle".
       You can choose an Animation or a ModelPart to toggle. You can set a list of Exclusive Tags for the toggle (UUID[]). You can set if the toggle is Saved or not.

the new Layers, only needed for fancy stuff:

Add the Layers tab. It should be a master-detail view.

If nothing is selected, the right sidebar should have a reorderable list of layer conditions. When a node is selected, the right sidebar should let you edit that node. When a transition is selected, the right sidebar should let you edit that transition.

In the future, the center will be a visualization. But for now, the center should be a list of nodes and transitions.

These are the proposed types for Layers:

```ts
// layers are ordered. the highest layer is the highest priority one.
layers: Record<UUID, Layer>


type Layer = {
  uuid: UUID,
  name: string,
  nodes: Record<UUID, LayerNode>,
  transitions: Record<UUID, LayerTransition>,
  // in order. the first condition that matches will be the one
  conditions: Record<UUID, LayerCondition>,
};
type LayerNode = {
  uuid: UUID,
  animation?: AnimationID, // 'Once' animations are not allowed
};
type LayerTransition = {
  uuid: UUID,
  fromNode: UUID,
  toNode: UUID,
  
  // if no animation is set, the transition will be instant
  animation?: AnimationID, // 'Loop' animations are not allowed

  reverse: boolean, // if the animation should play in reverse
  allowCancel: boolean, // if the target node we're animating to can be gotten to faster by going from this animation's fromNode, allow cancelling this animation
  weight: number, // default 1.0
};
type LayerCondition = {
  uuid: UUID,
  condition?: Condition,
  targetNode?: UUID,
};
```

- [x] In the LayerConditionsEditor and the , the AnimationConditionEditor is too big. Create a new component that is an inline preview of the Condition and clicking on it opens a modal with the AnimationConditionEditor, and use that component in LayerConditionsEditor.
- [x] Update the LayerNodeEditor to include a list of transitions coming from this node and have a button to add a transition there. You should be able to add a transition to any existing node, or add a new node with an animation. If you add a new node this way, it should automatically set up two transitions: One from the current node to the new node with the animation and one from the new node to the current node with the animation and reverse set to true.
- [x] Update the layer graph to use floating edges
- [ ] Fix when there's multiple overlapping transitions (no overlap)
- [ ] Update layers so there is always at least one node.
  - actually we don't really need a root node arguably?
  - because you set conditions and when we check for the first time we can jump to the target one
- [ ] Remove the "add node" button from the layer state machine after ^^
- [ ] Change the 'Exclusive Tags' editor so it does not need a modal. Instead, you can type in a tag. It will offer to add it if it doesn't exist or let you select from an existing tag.
- [ ] Improve the activation condition summaries.
- [ ] Consider using avatar zip files instead of the folder, so you can upload the whole avatar at once
  and download the whole avatar at once
