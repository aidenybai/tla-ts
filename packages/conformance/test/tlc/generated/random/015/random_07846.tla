(*---
description: Evaluates a random seq expression, seed 262, number 7846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SelectSeq(SubSeq(<<1>>, 2147483647, 7), LAMBDA e : e > 0), LAMBDA p, q : p < q), IF ((1 \in 2..1) <=> (0 < 0)) THEN (((1 :> 2))[7] % (0 - SUBSET {1})) ELSE ((-0) + [[a |-> 1] EXCEPT !.a = @ + 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07846 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
