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

- [ ] Remove Toggle Groups from the app as they are no longer needed.
