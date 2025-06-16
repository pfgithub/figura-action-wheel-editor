local ocpConfig = {
    modelPart = nil, -- models.model.Character
    enable = true,
    allowEyeOffset = false,
    offset = vec(0, 27.648, 0),
}
-- %FiguraEditor.LibSetting% ["Body Root Part", "ModelPart"] %(lib).modelPart = %(value)
-- %FiguraEditor.LibSetting% ["Offset", "vec3", [0, 27.648, 0]] %(lib).offset = %(value)
-- %FiguraEditor.RenderSetting% "Disable" %(lib).enable = not %(value)
-- %FiguraEditor.RenderSetting% "Move Crosshair (May trigger AntiCheat in multiplayer)" %(lib).enable = not %(value)

function events.render(delta,context)
    if ocpConfig.enable and ocpConfig.modelPart then
		local animPos = ocpConfig.modelPart
			:getPositionMatrix()
			:translate(vec(0,0,0):sub(ocpConfig.offset))
			:apply(ocpConfig.offset)
		-- can't figure out how & where to apply the rotation properly
		animPos.x = 0
		animPos.z = 0
        renderer:setOffsetCameraPivot(animPos.x / 16, animPos.y / 16, animPos.z / 16)
        if ocpConfig.allowEyeOffset then
            renderer:setEyeOffset(animPos.x / 16, animPos.y / 16, animPos.z / 16)
        end
    end
end

return ocpConfig