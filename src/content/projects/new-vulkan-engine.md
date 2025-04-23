---
title: 'New Vulkan Engine'
description: 'Redoing my Vulkan engine'
pubDate: 'Apr 12 2025'
featured: true
heroImage: '/pbd.png'
category: 'Technical'
---

[GitHub Link](https://github.com/will-ixs/Sun)

After a long reflection on how much I had learned from my first attempt at making an engine, followed by a short reflection on how terrible of a setup it was, I started on a new project. The last engine was purely made to learn, I honestly had never intended to make it public at first, so it was set up to build using static environment variables and manual installations of its dependencies. This meant it had an incredibly high barrier of entry to building, which I decided was overall Not Great. So I'm here, restarting, and have pretty much caught up to where I was in a significantly smaller timeframe. I've still done most of my learning from vkguide, but on this attempt have had much more confidence in my ability to abstract in my own way and set up the engine in a way I like.

I'm currently very excited about this project. I'm using this engine for a final project in my computer animation class where I'm implementing PBD Fluids. It's not complete yet but is going well, it's on its own PBD branch at the moment.

I havent yet got around to writing a readme for this project, I'll remove this part when I do, but I'm using dynamic rendering, a bindless setup for the first time (easier than expected). Once I finish my projects for this semester I want to redo the shadow mapping and background thread for mesh uploading that I did previously. After that I have planned to work on PBR materials. 


![bunch of spheres rendered with their normal colors the corner of a empty cube](/pbd.png)
PBD Fluids (Incomplete ATM)