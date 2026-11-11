(*---
description: :> nests.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_nested ----
EXTENDS TLC, Naturals
Test == (1 :> (2 :> 3))[1][2] = 3
====

(*--- recorded
all:
  exit: 0
---*)
