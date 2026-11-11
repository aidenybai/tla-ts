(*---
description: Evaluates a random bool expression, seed 262, number 3290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(Tail(<<2, -1>>), LAMBDA e : e > 0), CASE ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]) -> ((0 - 1) + LET b5233 == 7 IN b5233) [] OTHER -> ((CHOOSE f \in [2..1 -> 2..1] : TRUE))[(-2)], ([((1 :> 2) @@ <<5, 6>>) EXCEPT ![(CHOOSE b5234 \in SUBSET {1} : FALSE)] = (2 + 7)])[Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03290 failed.
    Attempted to apply function:
    <<>>
    to argument -2, which is not in the domain of the function.
---*)
