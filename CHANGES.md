We are happy in announce 1.0.0!

New features:
- Add `edgeForm` to cylinders (#32)
- Add cones (#38)
- Add tubes (#40)

Improvements:
- Update three.js to r132 (#32)
- Improve package.json (#26)
- Improve the documentation and add live examples without downloading (#37)
- Improve protocol version checking (#41)
- Decrease spheres RAM usage
- Set spheres default radius to 1

Bug fixes:
- Fix bug in camera rotation (introduced in 0.5.2)
- Fix bug in axes
- Fix bug in arrow color
- Fix bug in the spotlight position when moving the camera around
- Remove point light's visible sphere (#24). As @axkr mentioned in #16, it isn't expected

Internals:
- More intensive use of custom shader. Custom shaders are faster and more flexible
- Split primitives.js into multiple files (#28). Thanks to @rocky for the idea
- Replace `InstancedMesh` by the lower-level `InstancedBufferGeometry`