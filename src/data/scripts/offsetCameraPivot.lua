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

    
-- Multiply two quaternions: q = q1 * q2
function quaternionMultiply(q1, q2)
    local w1, x1, y1, z1 = table.unpack(q1)
    local w2, x2, y2, z2 = table.unpack(q2)

    local w = w1*w2 - x1*x2 - y1*y2 - z1*z2
    local x = w1*x2 + x1*w2 + y1*z2 - z1*y2
    local y = w1*y2 - x1*z2 + y1*w2 + z1*x2
    local z = w1*z2 + x1*y2 - y1*x2 + z1*w2

    return { w, x, y, z }
end

--- Rotates a quaternion by a given angle around the global X axis.
-- @param q The original quaternion {w, x, y, z}.
-- @param angleDeg The angle to rotate by, in degrees.
-- @return The new, rotated quaternion.
function quaternionRotateX(q, angleDeg)
    -- Create a quaternion that represents a rotation around the X axis (1, 0, 0)
    local halfAngleRad = math.rad(angleDeg) * 0.5
    local c = math.cos(halfAngleRad)
    local s = math.sin(halfAngleRad)
    local rotX = { c, s, 0, 0 } -- {w, x*sin, y*sin, z*sin}

    -- Multiply the original quaternion by the rotation quaternion.
    -- The order matters: rot * q applies the rotation in the global frame.
    return quaternionMultiply(rotX, q)
end

--- Rotates a quaternion by a given angle around the global Y axis.
-- @param q The original quaternion {w, x, y, z}.
-- @param angleDeg The angle to rotate by, in degrees.
-- @return The new, rotated quaternion.
function quaternionRotateY(q, angleDeg)
    -- Create a quaternion that represents a rotation around the Y axis (0, 1, 0)
    local halfAngleRad = math.rad(angleDeg) * 0.5
    local c = math.cos(halfAngleRad)
    local s = math.sin(halfAngleRad)
    local rotY = { c, 0, s, 0 }

    -- Multiply to apply the rotation
    return quaternionMultiply(rotY, q)
end

--- Rotates a quaternion by a given angle around the global Z axis.
-- @param q The original quaternion {w, x, y, z}.
-- @param angleDeg The angle to rotate by, in degrees.
-- @return The new, rotated quaternion.
function quaternionRotateZ(q, angleDeg)
    -- Create a quaternion that represents a rotation around the Z axis (0, 0, 1)
    local halfAngleRad = math.rad(angleDeg) * 0.5
    local c = math.cos(halfAngleRad)
    local s = math.sin(halfAngleRad)
    local rotZ = { c, 0, 0, s }

    -- Multiply to apply the rotation
    return quaternionMultiply(rotZ, q)
end

function vectorToEulerDeg(vecIn)
    local x, y, z = vecIn.x, vecIn.y, vecIn.z

    -- Normalize to prevent math domain errors
    local length = math.sqrt(x*x + y*y + z*z)
    if length == 0 then return vec(0, 0, 0) end
    x, y, z = x / length, y / length, z / length

    -- Pitch is up/down
    local pitch = math.asin(-y)  -- [-pi/2, pi/2]

    -- Yaw is left/right (horizontal direction)
    local yaw = math.atan2(x, z) -- [-pi, pi]

    return vec(math.deg(pitch), -math.deg(yaw), 0)
end

---
-- Converts a vec of Euler angles (pitch, yaw, roll) in degrees to a quaternion.
-- The function applies the rotations in the order: Yaw (Y), then Pitch (X), then Roll (Z).
-- @param angles A vec {x=pitch, y=yaw, z=roll} with values in degrees.
-- @return A quaternion table {w, x, y, z}.
--
function vecToQuat(angles)
    -- The identity quaternion represents no rotation.
    local q = {1, 0, 0, 0} -- {w, x, y, z}

    -- Apply rotations in the desired order (Yaw, then Pitch, then Roll).
    -- Since the helper functions apply global rotations, this sequence
    -- correctly builds the final orientation.
    q = quaternionRotateY(q, angles.y) -- Apply Yaw around global Y
    q = quaternionRotateX(q, angles.x) -- Apply Pitch around global X
    q = quaternionRotateZ(q, angles.z) -- Apply Roll around global Z

    return q
end


---
-- Converts a quaternion to a vec of Euler angles (pitch, yaw, roll) in degrees.
-- This conversion is for the rotation order: Yaw (Y), Pitch (X), Roll (Z).
-- It correctly handles the gimbal lock singularity.
-- @param q A quaternion table {w, x, y, z}.
-- @return A vec {x=pitch, y=yaw, z=roll} with values in degrees.
--
function quatToVec(q)
    local w, x, y, z = q[1], q[2], q[3], q[4]

    local pitch, yaw, roll

    -- Test for the gimbal lock singularity (when pitch is +/- 90 degrees)
    -- In this case, sin(pitch) = 2*(w*x + y*z) will be close to 1 or -1.
    local sin_p = 2 * (w * x + y * z)

    -- Use a small epsilon for floating-point comparisons
    local epsilon = 0.99999
    if math.abs(sin_p) > epsilon then
        -- We are in gimbal lock
        pitch = (math.pi / 2) * math.sign(sin_p) -- Set pitch to +/- 90 degrees
        yaw = 2 * math.atan2(y, w) -- Calculate combined yaw and roll
        roll = 0 -- Set roll to 0 to resolve ambiguity
    else
        -- Standard case (no gimbal lock)
        -- Pitch (rotation around X)
        pitch = math.asin(sin_p)

        -- Yaw (rotation around Y)
        yaw = math.atan2(2 * (w*y - x*z), 1 - 2 * (x*x + y*y))

        -- Roll (rotation around Z)
        roll = math.atan2(2 * (w*z - x*y), 1 - 2 * (x*x + z*z))
    end

    -- Convert angles from radians to degrees and return as a vec
    return vec(math.deg(pitch), math.deg(yaw), math.deg(roll))
end

function mod(a, b)
  -- how can you call it fmod when it's actually frem. evil.
  return math.fmod(math.fmod(a, b) + b, b)
end
function wrapDeg(a)
	return mod(a + 180, 360) - 180
end

local printMod = 0
local isHost = host:isHost()
local lastFrameSetRot = false
function events.render(delta,context)
	if not isHost then return end
	printMod = printMod + 1
	if printMod == 100 then printMod = 0 end
    if ocpConfig.enable and ocpConfig.modelPart then
		local animPos = ocpConfig.modelPart
			:getPositionMatrix()
			:translate(vec(0,0,0):sub(ocpConfig.offset))
			:apply(ocpConfig.offset)
		animPos.x = 0
		animPos.z = 0
        renderer:setOffsetCameraPivot(animPos.x / 16, animPos.y / 16, animPos.z / 16)
		
		local playerRot = player:getRot(delta)
		lookDirDeg = vec(playerRot.x, playerRot.y, 0)
		if renderer:isCameraBackwards() then lookDirDeg = vec(-lookDirDeg.x, lookDirDeg.y - 180, 0) end
		
		local bodyRot = 180 - wrapDeg(player:getBodyYaw(delta))
		lookDirDeg.y = lookDirDeg.y + bodyRot
		
		local lookDirQuat = vecToQuat( lookDirDeg )
		
		local bodyDirDeg = ocpConfig.modelPart:getTrueRot()
		local bodyDirQuat = vecToQuat(bodyDirDeg)
		
		local finalDirQuat = quaternionMultiply(lookDirQuat, bodyDirQuat)
		local finalDirDeg = quatToVec(finalDirQuat)

		local nextCameraRot = vec(finalDirDeg.x, finalDirDeg.y - bodyRot, finalDirDeg.z)
		nextCameraRot.x = wrapDeg(nextCameraRot.x)
		nextCameraRot.y = wrapDeg(nextCameraRot.y)
		nextCameraRot.z = wrapDeg(nextCameraRot.z)
		local diffX = playerRot.x - nextCameraRot.x
		local diffY = playerRot.y - nextCameraRot.y
		local diffZ = 0 - nextCameraRot.z
		diffX = math.abs(wrapDeg(diffX))
		diffY = math.abs(wrapDeg(diffY))
		diffZ = math.abs(wrapDeg(diffZ))
		local epsilon = 0.01
		if diffX > epsilon or diffY > epsilon or diffZ > epsilon then
			renderer:setCameraRot(nextCameraRot)
			lastFrameSetRot = true
		elseif lastFrameSetRot then
			lastFrameSetRot = false
			renderer:setCameraRot()
		end
		
        if ocpConfig.allowEyeOffset then
            renderer:setEyeOffset(animPos.x / 16, animPos.y / 16, animPos.z / 16)
        end
    end
end


return ocpConfig
