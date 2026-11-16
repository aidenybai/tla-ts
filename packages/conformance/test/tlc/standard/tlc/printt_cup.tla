(*---
description: A union of enumerated sets prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_cup ----
EXTENDS TLC, Naturals
Test == PrintT({1} \cup {2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
