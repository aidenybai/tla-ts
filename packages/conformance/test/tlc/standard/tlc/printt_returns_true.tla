(*---
description: PrintT equals TRUE.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_returns_true ----
EXTENDS TLC, Naturals
Test == PrintT(1) = TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
