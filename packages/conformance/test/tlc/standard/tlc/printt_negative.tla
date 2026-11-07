(*---
description: PrintT prints a negative integer.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_negative ----
EXTENDS TLC, Naturals
Test == PrintT(0 - 42)
====

(*--- recorded
all:
  exit: 0
  transcript: "| -42"
---*)
