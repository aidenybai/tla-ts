(*---
description: An intersection of enumerated sets prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_cap ----
EXTENDS TLC, Naturals
Test == PrintT({1, 2} \cap {2, 3})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
