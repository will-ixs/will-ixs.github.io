---
title: 'Keylogger Breakdown'
description: 'Reverse engineering a keylogger.'
pubDate: 'Jan 11 2025'
featured: true
heroImage: '/function.png'
---

This was a breakdown of the Ardamax keylogger. This was my final project for my Reverse Engineering class, downloading a known piece of malware (mine was from [theZoo](https://github.com/ytisf/theZoo)), doing some analysis on it, and writing a report about it.

Using the tools and techniques we had practiced throughout the semester, the goal was to just gain as much insight as possible about the malware, like what files it created, what registries entries it created, if it made any network requests, what, if any, it's hidden functions were. 

![Screenshot showing keylogger files being written to disk](/writefile.png)

I can't post the full report, but I'll summarize it here: I selected an executable called Ardamax. It was a regular executable, it didn't require any tools or dynamic analysis to unpack and decompile it. Looking through Ghidra I mostly noticed functions imported form kernel32.dll and user32.dll, mostly relating to reading and writing files, as well as some UI. I wrote a breakdown of one funciton that allocated some memory for a C++ objected, noted by the use of the new keyword as well as calling functions offset from that memory address later on. Later in the dynamic analysis I would discover this funciton was creating temporary files to write data in chunks to, then once the log/screenshot was complete it would rename it. The main executable created a registry key to launch it's logger at startup and hid its executable in a hidden folder in the C:\Windows\SysWOW64 directory. It stored logs and full screenshots there. Removing the malware is simple as removing the registry key and deleting the hidden logging folder. There were no network requests made.