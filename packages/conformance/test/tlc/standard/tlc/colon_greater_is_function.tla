(*---
description: :> makes a one-point function equal to the mapping form.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_is_function ----
EXTENDS TLC, Naturals
Test == (1 :> 2) = [x \in {1} |-> 2]
====

(*--- recorded
all:
  exit: 0
---*)
