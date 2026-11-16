(*---
description: An empty interval prints as the empty set.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_empty_interval ----
EXTENDS TLC, Naturals
Test == PrintT(3..1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
