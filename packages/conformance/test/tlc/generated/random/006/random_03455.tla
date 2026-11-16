(*---
description: Evaluates a random int expression, seed 262, number 3455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b5473 \in (SUBSET {1} \cap 1..3) |-> IF TRUE THEN b5473 ELSE b5473])[(CHOOSE b5474 \in (1..3 \cup FALSE) : ([a |-> 1] = [a |-> 1, b |-> TRUE]))] % IF (\E b5475 \in DOMAIN <<5, 6>> : (TRUE /\ TRUE)) THEN Cardinality((1..3 \ {1})) ELSE Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03455 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
