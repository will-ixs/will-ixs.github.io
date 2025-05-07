---
title: 'Position Based Fluids'
description: 'Implementing PBF- an extension to the PBD framework'
pubDate: 'May 6 2025'
featured: true
heroImage: '/splash.webm'
heroVideo: true
category: 'Technical'
---

For my Computer Animation final project I implemented [Position Based Fluids](https://mmacklin.com/pbf_sig_preprint.pdf).

The main challenge of this assignment is optimizing the neighbor lookups. I used the paper they linked in Position Based Fluids to implement my acceleration structure, which is simply a uniform grid. Its an old Nvidia white paper on [CUDA Particles](https://developer.download.nvidia.com/compute/cuda/1.1-Beta/x86_website/projects/particles/doc/particles.pdf).

I only finished a multithreaded CPU implementation before the class deadline, but just a day after I finished my GPU implementation using compute shaders to support massively more particles. There's still room for optimization in it since I was crude with my synchronization to make sure it was not the reason for any of my issues during development.

Here is the video discussing the implementation, at this point I only had the CPU implementation working:

<video controls width="720" height="360">
<<<<<<< HEAD
  <source src="/particles.mp4" type="video/mp4" />
=======
  <source src="/particles-presentation.mp4" type="video/mp4" />
>>>>>>> 9194a14 (PBF Post)
  Your browser does not support the video tag.
</video>

Libraries used:\
Vulkan - Graphics API\
VulkanMemoryAllocator - Easy buffer/image allocation\
VkBootstrap - Reduce verbosity of startup\
fastgltf - Model loading\
glm - Math library\
SDL3 - Windowing\
Dear ImGui - Immediate mode GUI


