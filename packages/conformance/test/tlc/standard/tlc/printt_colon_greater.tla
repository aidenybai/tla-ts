(*---
description: A single :> away from 1 prints in parentheses.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_colon_greater ----
EXTENDS TLC, Naturals
Test == PrintT(2 :> 3)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 3)"
---*)
