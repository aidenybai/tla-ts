(*---
description: Evaluates a random seq expression, seed 262, number 7331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SubSeq(Tail(<<3, 1, 2>>), ((1 :> 2))[-1], Cardinality({})), LAMBDA e : e > 0), LET b11280 == IF (TRUE \/ [x \in Nat |-> x + 1]) THEN (2147483647 - 1) ELSE Len(<<1, 2>>) IN ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a, ((CHOOSE f \in [2..1 -> {1}] : TRUE))[(-(0 * 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07331 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
