(*---
description: Evaluates a random seq expression, seed 262, number 8840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq([([a |-> 1, b |-> TRUE] = [a |-> 1]) EXCEPT ![1] = (CHOOSE b13686 \in {2, 1, 3} : TRUE)], LET b13687 == CASE SUBSET {1} -> <<3, 1, 2>> [] OTHER -> 7 IN (-b13687), ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a) \o <<((1..3 \cap TRUE) + IF TRUE THEN 0 ELSE 2147483647), (Cardinality({2, 1, 3}) \div Len(<<1>>))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08840 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
