(*---
description: EXCEPT applies to a :> function.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_except ----
EXTENDS TLC, Naturals
Test == [1 :> 2 EXCEPT ![1] = 3] = (1 :> 3)
====

(*--- recorded
all:
  exit: 0
---*)
