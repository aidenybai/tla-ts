(*---
description: PrintT prints a record with its fields in the written order.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_record ----
EXTENDS TLC, Naturals
Test == PrintT([b |-> 1, a |-> 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b |-> 1, a |-> 2]"
---*)
