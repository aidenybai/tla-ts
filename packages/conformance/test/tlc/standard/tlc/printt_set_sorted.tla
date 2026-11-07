(*---
description: PrintT prints a set in normalized order.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_set_sorted ----
EXTENDS TLC, Naturals
Test == PrintT({3, 1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
