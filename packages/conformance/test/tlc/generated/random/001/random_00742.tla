(*---
description: Evaluates a random int expression, seed 262, number 742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({([a |-> 1, b |-> TRUE]).a, IF FALSE THEN 2147483647 ELSE -1}) \div (CHOOSE b1219 \in ({b1220 : b1220 \in {1, 2}} \cup UNION {{x \in 1..3 : x > 1}, {1}}) : (({x \in 1..3 : x > 1} \cap {2, 1, 3}) = {b1221 \in {2, 1, 3} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00742 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 98 to line 14, col 254 of module random_00742
---*)
