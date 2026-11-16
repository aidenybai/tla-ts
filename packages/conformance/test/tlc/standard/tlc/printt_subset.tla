(*---
description: PrintT deep-normalizes its copy, so SUBSET prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_subset ----
EXTENDS TLC, Naturals
Test == PrintT(SUBSET {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}, {2}, {1, 2}}"
---*)
