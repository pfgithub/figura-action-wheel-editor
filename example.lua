=================
local mainPage = action_wheel:newPage()
action_wheel:setPage(mainPage)


function pings.bowl()
    animations.model.test1:play()

end


local action = mainPage:newAction()
    :title("Test action1")
    :item("minecraft:dirt")
    :hoverColor(1, 0, 1)
    :onLeftClick(pings.bowl)
=================


Youtube doesn't let me put greater than or less than symbols

=================
vanilla_model.PLAYER:setVisible(false)

function events.tick()
    local crouching = player:getPose() == "CROUCHING"
    local sprinting = player:isSprinting()
    local blocking = player:isBlocking()
    local fishing = player:isFishing()
    local sleeping = player:getPose() == "SLEEPING"
    local swimming = player:getPose() == "SWIMMING"
    local flying = player:getPose() == "FALL_FLYING"
    local walking = player:getVelocity().xz:length() > .01

    animations.model.i:setPlaying(not walking and not crouching)
end