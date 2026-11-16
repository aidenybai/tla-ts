(*---
description: Evaluates a random seq expression, seed 262, number 5928.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05928 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (-1 - 0) [] OTHER -> IF [a |-> 1] THEN -1 ELSE 2147483647 \div Head([<<1>> EXCEPT ![1] = 3])), CASE (\E b9139 \in (2..1 \cup {2, 1, 3}) : (SUBSET {1} \subseteq {1, 2})) -> ([b9140 \in 1..3 |-> b9140])[([x \in Nat |-> x + 1])[7]] [] OTHER -> [a |-> Cardinality({1, 2}), b |-> (<<5, 6>> /\ FALSE)]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05928 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 84 to line 14, col 154 of module random_05928
---*)
