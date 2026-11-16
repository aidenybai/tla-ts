(*---
description: subbag applied to double_at, a FcnRcdValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<>>,
    |   <<1>>,
    |   <<2>>,
    |   (2 :> 1),
    |   (2 :> 2),
    |   (2 :> 3),
    |   <<1, 1>>,
    |   <<1, 2>>,
    |   <<1, 3>>,
    |   <<2, 1>>,
    |   <<2, 2>>,
    |   <<2, 3>> }
---*)
