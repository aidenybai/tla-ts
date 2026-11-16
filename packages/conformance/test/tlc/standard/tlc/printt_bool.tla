(*---
description: PrintT prints TRUE and FALSE.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_bool ----
EXTENDS TLC, Naturals
Test == PrintT(<<TRUE, FALSE>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<TRUE, FALSE>>"
---*)
