(*---
description: \E stops printing at the first TRUE.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_exists_stops ----
EXTENDS TLC, Naturals
Test == \E x \in 1..3 : PrintT(x) /\ x = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
