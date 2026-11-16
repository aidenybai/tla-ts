(*---
description: subbag applied to function, a FcnRcdValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([x \in {1, 2} |-> x * 2]))
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
    |   (2 :> 4),
    |   <<1, 1>>,
    |   <<1, 2>>,
    |   <<1, 3>>,
    |   <<1, 4>>,
    |   <<2, 1>>,
    |   <<2, 2>>,
    |   <<2, 3>>,
    |   <<2, 4>> }
---*)
