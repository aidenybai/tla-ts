(*---
description: With the fixed seed, the picks from a function set repeat exactly.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_seeded_function_set ----
EXTENDS TLC, Naturals
Test == PrintT(RandomElement([1..5 -> 1..100]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<74, 92, 92, 68, 8>>"
---*)
