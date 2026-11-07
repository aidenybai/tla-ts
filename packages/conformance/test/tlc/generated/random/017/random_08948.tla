(*---
description: Evaluates a random seq expression, seed 262, number 8948.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08948 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(<<([a |-> 1])[0], ([a |-> 1] % 7)>>, LAMBDA p, q : p < q) \o <<CASE (TRUE \/ TRUE) -> Cardinality({x \in 1..3 : x > 1}) [] OTHER -> ([a |-> 1]).a, ((CHOOSE b13887 \in {1} : FALSE) + (2147483647 % 0))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08948 failed.
    Attempted to access record by a non-string argument: 0
---*)
