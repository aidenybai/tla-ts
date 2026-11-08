(*---
description: Evaluates a random set expression, seed 262, number 5105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(Cardinality([a |-> 1, b |-> TRUE]) .. Len(<<1, 2>>)), UNION {(CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE), UNION {2..1, {}}}} \ {CASE (~FALSE) -> Head(<<>>) [] OTHER -> IF TRUE THEN 2147483647 ELSE [a |-> 1, b |-> TRUE], (({} % 0) + CASE TRUE -> 0 [] OTHER -> <<3, 1, 2>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05105 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1, b |-> TRUE]
---*)
