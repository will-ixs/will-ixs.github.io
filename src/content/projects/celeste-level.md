---
title: 'Designing a Celeste Map'
description: 'Designing a Celeste level starting from nothing.'
pubDate: 'Apr 22 2025'
featured: true
heroImage: '/celeste-step3.png'
heroVideo: false
category: 'Design'
---


Things I know right now (before any sketching, planning, or building):
- I want an aesthetic involving: Urban Decay + Reclaimed by Nature
- I’ll be using Loenn (Celeste mapping tool).

My plan going forward will be to sketch a large-scale representation of the space the level will take place in, then block it out in Loenn to decide what the path through the space will look like.

---

With my aesthetic theme in mind, I made a reference board and sketched a layout for a level from those ideas.

![Reference board with collapsing buildings, nature overgrowing](/celeste-refboard.png)

After making the reference board I decided I want three distinct “environments” within the overall environment. I want the ground level houses, I want the skyscrapers, and I want a Big Tree™. \
The initial sketch:

![Pencil paper sketch of a few building in succession, leading to a large tree](/celeste-sketch.png)

---

I started blocking out the stage based on the sketch in the editor Loenn. I was mostly determined on getting shapes in and determining their sizes relative to each other, not paying attention to colors or details yet.

![Loenn screenshot, outlining the buildings from the sketch](/celeste-step1.png)

---

Filling in the blockouts, I switched to the right materials and tile layers. On the left you can see a big red square, this was a room exactly the size of how much the camera can see. I would place it over my blockouts to determine how much I wanted on screen at any point in time, resizing if required.

My favorite thing to do in Celeste is dash a lot and go fast, so a lot of the mindset around gameplay design is creating areas where you have enough space to dash between where you are and where you’re supposed to go, and where you’re supposed to go allows you to dash again.

![Loenn screenshot, buidlings much more filled in](/celeste-step2.png)

I don’t think of dying in this game as particularly a punishment (losing progress), moreso progress isn’t made until you reach the next respawn location. You typically don’t want the level to feel unforgiving though. Respawn locations are placed relatively frequently in the locations that have them, I placed them in increments of about a screen’s worth of level. You shouldn’t have to go too far back, but you shouldn’t need a respawn on every single jump where it's possible to die, especially when the jumps have multiple options for completion, and are not arbitrarily precise. Death is learning in this game. - All that said, once the gameplay for a section was complete, then I would decide how frequently to put respawn locations and where to put them.

---


Skyscraper areas filled with gameplay added. The tree is still hollow. I don’t like how the game's wood texture looks when filling in a large area like I need for this tree, so I’m going to create my own wood texture.

![Loenn screenshot, skyscraper areas filled with gameplay added. The tree is still hollow.](/celeste-step3.png)

The skyscraper fits a more traditional sense of forgiveness than the one I mentioned above about respawn locations. There are only two in the skyscraper, at the very bottom and at the very top. There is no way to die on the skyscraper (until you’ve reached the top and respawn on up there, when I enable a death barrier so you can’t accidentally fall all the way back down), so recovery is more of mitigating how far you fall, with the potential to fall further increasing as you climb the tower.

After learning how tilemaps are set up in this engine, I began trying things. I didn’t think with my skill level, I’d be able to paint a good looking tilemap with texture, so I began color picking, making gradients of those colors, adding noise, quantizing the colors, and denoising until I had something that I thought looked nice. 

![Wood tilemap texture](/celeste-treetex.png)

To make the background version of the tilemap, I applied a curves modifier, lowering the red and green channels slightly lower than the blue channel. It would make it darker and slightly purplish, to match the tone of the night sky and the background colors I was already going with.

![Same wood texture, but darker and a little more blue](/celeste-treetexshadow.png)

---


Filling in detail, closer up screenshots of each section. I really wanted the vines on the skyscraper to look like they were on top of it, but there is only one layer for background tiles in Loenn. I zoomed out until each pixel of the tower was one pixel in the editor, turned off all the other layers, and took a screenshot. I added windows on top of this and imported it as background decal so that the vibes on the tower could sit on top of it.

![Close up screenshot of the ground level buildings](/celeste-step4-1.png)
![Close up screenshot skyscraper section](/celeste-step4-2.png)
![Close up screenshot of a tree](/celeste-step4-3.png)

It’s important to show the player what is ahead of them so they have time to process, plan, and react to it. The final pass over the level involves playing through the level, adding camera offset triggers at each respawn location and where the direction of movement across the map changes. Sometimes this requires adding boolean flags, to be checked by reaching certain areas, especially so in maps with backtracking and reuse of space. E.g. The camera shifts right when the player needs to move right to advance in the ground level buildings, and left when the player needs to move left. In the skyscraper climb section the player is horizontally centered since they need to go left and right about equal amounts, but the camera is shifted up so the player can see above themselves during that climb.

Once the gameplay and aesthetics were sufficiently complete, I chose the music track from the base game that I thought fit the level well, did the background styling, and added the metadata so the menuing looks good and the level doesn’t appear as {Will_LevelDesign_7_Ld4} in game.


[Video Playthrough (Google Drive)](https://drive.google.com/file/d/1D_KzjujDWOYQVtO-c8Hcv9qbkaYhFGlp/view?usp=sharing)


---

Image reference sources: \
https://www.telegraph.co.uk/news/picturegalleries/worldnews/10191002/Detroit-in-pictures-the-urban-decay-of-Motor-City-as-it-files-for-bankruptcy.html \
https://nextcity.org/urbanist-news/the-curious-art-of-urban-decay \
Nier Automata 
