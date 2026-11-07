(*---
description: A set map prints its normalized result.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_map ----
EXTENDS TLC, Naturals
Test == PrintT({x * 2 : x \in 1..2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 4}"
---*)
