(*---
description: Evaluates a random function expression, seed 262, number 8778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SelectSeq(Tail(<<>>), LAMBDA e : e > 0) EXCEPT ![1] = Head((Nat \cap {2, 1, 3}))] EXCEPT ![((CHOOSE b13592 \in (2147483647 % 2147483647) : (~FALSE)) + LET b13593 == Cardinality({1}) IN LET b13594 == -1 IN 3)] = ((CHOOSE b13595 \in {b13596 \in SUBSET {1} : TRUE} : (TRUE /\ FALSE)) \div Len([<<>> EXCEPT ![1] = 3]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08778 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
