(*---
description: Evaluates a random bool expression, seed 262, number 2403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<IF ({1} \subseteq SUBSET {1}) THEN (CHOOSE b3803 \in {2, 1, 3} : FALSE) ELSE (2 * 3), (LET b3804 == 2 IN 1 \div ([a |-> 1, b |-> TRUE]).a)>> = (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02403 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
