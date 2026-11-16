(*---
description: Strings sort in TLC's order.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_strings_sorted ----
EXTENDS TLC, Naturals
Test == PrintT({"b", "a", "ab", "B"})
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a", "b", "ab", "B"}'
---*)
