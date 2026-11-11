(*---
description: Evaluates a random set expression, seed 262, number 7376.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07376 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b11356 \in ({FALSE : b11357 \in SUBSET {1}} \cup UNION {{2, 1, 3}, {}}) : ((1..3 = {x \in 1..3 : x > 1}) /\ (1 = 7))} \cup [a |-> Cardinality(({} \cup 2..1)), b |-> ((CHOOSE b11358 \in {2, 1, 3} : FALSE) < IF TRUE THEN 2 ELSE 7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07376 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    1
---*)
