(*---
description: PrintT deep-normalizes its copy, so a record set prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_record_set ----
EXTENDS TLC, Naturals
Test == PrintT([a : {1, 2}, b : {3}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[a |-> 1, b |-> 3], [a |-> 2, b |-> 3]}"
---*)
