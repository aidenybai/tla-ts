(*---
description: Evaluates a random seq expression, seed 262, number 8927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = (CHOOSE b13843 \in {2, 1, 3} : TRUE)] \o SubSeq([<<1>> EXCEPT ![1] = -1], ([x \in Nat |-> x + 1])[0], ((1 :> 2))[7])), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08927 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
