(*---
description: Evaluates a random int expression, seed 262, number 463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((2 = 0) \/ (FALSE => TRUE)) THEN (CHOOSE b767 \in (2147483647 \cup {1}) : (2 = b767)) ELSE IF (FALSE \/ TRUE) THEN (CHOOSE b768 \in TRUE : -1) ELSE Cardinality({1}) % ((-([x \in Nat |-> x + 1])[2147483647]) + Len([<<>> EXCEPT ![1] = 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00463 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    2147483647
    are not both enumerable
---*)
