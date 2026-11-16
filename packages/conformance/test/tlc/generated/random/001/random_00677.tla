(*---
description: Evaluates a random int expression, seed 262, number 677.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00677 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(({1} \ Nat)) + ((FALSE => TRUE) => (<<5, 6>> /\ TRUE))) * (CHOOSE b1134 \in (UNION {2..1, SUBSET {1}} \cup ({2, 1, 3} \cup SUBSET {1})) : (\E b1135 \in ({} \cap {1}) : (FALSE = (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00677 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a tuple.
    line 14, col 66 to line 14, col 81 of module random_00677
---*)
