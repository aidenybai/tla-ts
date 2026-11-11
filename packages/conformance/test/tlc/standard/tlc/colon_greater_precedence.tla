(*---
description: :> binds tighter than @@, so no parentheses are needed.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_precedence ----
EXTENDS TLC, Naturals
Test == 1 :> 2 @@ 3 :> 4 = [x \in {1, 3} |-> x + 1]
====

(*--- recorded
all:
  exit: 0
---*)
