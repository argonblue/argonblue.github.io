---
title: Remember to flush… your buffers
---

## Background

By default, the standard C library buffers all output streams: it stores bytes that are meant to be written, and writes them out in large blocks when the buffer is full.
The standard output stream is *line-buffered* (the library writes out the buffer to the file when the program writes a newline) on many systems, but only if the stream refers to an interactive device (such as a terminal).
This is the source of some frustrating failure modes.

## The problem

I was trying to get a hardware debug probe (the AVR Dragon) to talk to the debugging support in Visual Studio Code.
VS Code kept looking for output from `avarice`, the debug server that talks to the hardware probe, but not seeing it.
Running `avarice` from the command line worked just fine, and printed the expected output.
Even when VS Code wasn't seeing the output, the debug server had started up and was otherwise functioning correctly; VS Code was simply unaware of that.

## If you write debug servers

If you write debug servers, please flush your output buffers after writing status messages.
This is especially important if you write status messages that indicate that your server is ready to receive connections.
Alternatively, you could line-buffer your output (and also remember to write newlines).

## Workarounds if you use debug servers

Hopefully, the VS Code maintainers will adopt a solution that doesn't depend on every author of a debug server to explicitly flush or line-buffer their status messages.
There are workarounds for some situations, though.
On macOS, the C library allows you to change the default buffering of standard output by setting the environment variable `STDBUF1` to `L` (for line buffering), for example.
On Linux, there is the `stdbuf` utility that does similar things.
(It seems to use `LD_PRELOAD` to adjust some C library internals before running the main program.)
