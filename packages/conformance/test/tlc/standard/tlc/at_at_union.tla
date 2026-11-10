(*---
description: "@@ joins disjoint domains."
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_union ----
EXTENDS TLC, Naturals
Test == (1 :> "a") @@ (2 :> "b") = <<"a", "b">>
====

(*--- recorded
all:
  exit: 0
---*)
