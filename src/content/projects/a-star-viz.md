---
title: 'Visualizing A* Pathfinding '
description: 'Interactive A* Pathfinding'
pubDate: 'Jan 6 2025'
featured: false
heroImage: '/astar.png'
heroVideo: false
category: 'Technical'
---
Check out the interactive demo which runs in browser [here](https://will-ixs.itch.io/astar) on itch. Note that in browsers with gesture controls (Opera, Vivaldi) the intended controls may not work as smoothly/require extra input.

This will be a brief overview of how I created the visualization, not detailed explanation of the A* algorithm. If you want that check out either [this video](https://youtu.be/A60q6dcoCjw) by Polylog. Going into this project I had only heard of A* before. I knew it existed from watching polylog's youtube video about 6 months before. In my Data Structures and Algorithms class from my previous university semester, one of my homework assignments was implementing Dijkstra's Algorithm, so I have had some familliarity with implementing pathfinding algorithms. I knew implementing A* would be similar so I wanted to do it. 

I decided to use Unity for this project to simplify the creation of the visualization and interactability of the demo I wanted to make.
I created an Empty 2D scene, a prefab for the grid tiles, and a empty GameObject called "GridManager" to spawn in the grid on runtime. The tile prefab contained a couple sprite overlays that I could enable or disable to change the color of the tile, indicating the state of the tile. Each tile can either be normal, a wall, the start, the end, or a path. When the position of the start and the end tile's are tracked in the GridManager so that there can only be one goal and start at any time.

At start, the GridManager generates a 16:9 grid of tiles and positions the camera in the center of them. After that, every frame the GridManager checks the valid neighbors of each tile and calls execution of the A* script. The A* script first clears its auxilarry data structures, which include a List with the path to from the start to the goal, and a Dictionary with the tiles that have been checked as the key, and the cost as the value. The Start and Goal are spawned at the bottom left and top right respectively. After the data structures are cleared, the main pathfinding function is called. When it's done the List containing the path from the start to the goal is fully updated and all of the tiles have their sprites overlayed to show the path on screen.