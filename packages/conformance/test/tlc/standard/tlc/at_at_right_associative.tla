(*---
description: "@@ associates so the leftmost key wins."
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_right_associative ----
EXTENDS TLC, Naturals
Test == ((1 :> 1) @@ (1 :> 2) @@ (1 :> 3))[1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
