(*---
description: PrintT prints an integer.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_int ----
EXTENDS TLC, Naturals
Test == PrintT(42)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 42"
---*)
