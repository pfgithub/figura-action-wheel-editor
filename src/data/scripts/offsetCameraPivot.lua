local ocpConfig = {
    modelPart = nil, -- models.model.Character
    enable = true,
    allowEyeOffset = false,
    offset = vec(0, 0, 0),
}
-- %FiguraEditor.LibSetting% ["Model Root Part", "ModelPart"] %(lib).modelPart = %(value)
-- %FiguraEditor.LibSetting% ["Offset", "vec3", [0, 0, 0]] %(lib).offset = %(value)
-- %FiguraEditor.RenderSetting% "Disable" %(lib).enable = not %(value)
-- %FiguraEditor.RenderSetting% "Move Crosshair (May trigger AntiCheat in multiplayer)" %(lib).enable = not %(value)
-- if we use a lua parser we can make it a bit better maybe

function events.render(delta,context)
    if ocpConfig.enable and ocpConfig.modelPart then
        local animPos = ocpConfig.modelPart:getAnimPos():add(ocpConfig.offset)
        renderer:setOffsetCameraPivot(animPos.x / 16, animPos.y / 16, animPos.z / 16)
        if ocpConfig.allowEyeOffset then
            renderer:setEyeOffset(animPos.x / 16, animPos.y / 16, animPos.z / 16)
        end
    end
end

return ocpConfig