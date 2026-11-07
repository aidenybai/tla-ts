(*---
description: Evaluates a random seq expression, seed 262, number 853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Head(Tail(<<>>)) \div IF (2147483647 < 7) THEN IF FALSE THEN TRUE ELSE 2 ELSE LET b1391 == 7 IN b1391), [Cardinality(({1, 2} \ {1})) EXCEPT ![(CHOOSE b1392 \in (2..1 \cup {2, 1, 3}) : ([a |-> 1, b |-> TRUE] = FALSE))] = IF [(1 :> 2) EXCEPT ![7] = 3] THEN Cardinality(SUBSET {1}) ELSE (1 % -1)]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
