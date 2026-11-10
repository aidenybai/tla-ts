(*---
description: Evaluates a random bool expression, seed 262, number 3840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b6053 \in (SUBSET {1} \ 2..1) : (-1 \in SUBSET {1})) \div ((2 % 0) * ([a |-> 1, b |-> TRUE]).a)) = (LET b6054 == Cardinality([x \in 1..2 |-> x]) IN IF FALSE THEN b6054 ELSE b6054 + ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03840 failed.
    Attempted to check if the non-enumerable value
    -1
    is element of
    {{}, {1}}
---*)
