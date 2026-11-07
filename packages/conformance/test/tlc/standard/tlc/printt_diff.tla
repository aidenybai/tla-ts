(*---
description: A difference of enumerated sets prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_diff ----
EXTENDS TLC, Naturals
Test == PrintT({1, 2} \ {2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
