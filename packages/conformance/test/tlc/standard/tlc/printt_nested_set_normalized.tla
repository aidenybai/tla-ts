(*---
description: Nested sets are normalized too, and a smaller set sorts first.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_nested_set_normalized ----
EXTENDS TLC, Naturals
Test == PrintT({{2, 1}, {1}, {}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}, {1, 2}}"
---*)
