---
title: 'First Vulkan Renderer'
description: 'WIP Vulkan Renderer'
pubDate: 'Jan 3 2025'
featured: false
heroImage: '/shadowmapping.png'
---

This was my first real dive into graphics programming. I have taken the single computer graphics class that my university offers, which gave me a good introduction to many graphics concepts, but was fully based in OpenGL and had most of the OpenGL code abstracted away for us. We did some projects that were very useful for building understanding like a few different shadow techniques, a CPU rasterizer, and a CPU Ray Tracer with a BVH. I did well in the class and enjoyed the projects so I wanted to dive further into graphics programming, but I had no clue how much I did not know. I figured I would redo one of my class projects but in Vulkan to learn a more modern graphics API. It took me much longer than I expected, but I also have learned so much more than I could have imagined when I started.

The project is based off of [vkguide](https://vkguide.dev) by [vblanco](https://github.com/vblanco20-1) up through about chapter 3, where I figured I had learned enough to complete my initial goal of implementing shadow mapping. The renderer currently has implemented shadow mapping and a mesh uploading in a background thread.

![depthmap.png](/depthmap.png)