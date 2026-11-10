(*---
description: PrintT deep-normalizes its copy, so UNION prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_union ----
EXTENDS TLC, Naturals
Test == PrintT(UNION {{1}, {2}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
