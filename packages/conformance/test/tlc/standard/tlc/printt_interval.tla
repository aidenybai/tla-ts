(*---
description: An interval prints compactly.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_interval ----
EXTENDS TLC, Naturals
Test == PrintT(1..5)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..5"
---*)
