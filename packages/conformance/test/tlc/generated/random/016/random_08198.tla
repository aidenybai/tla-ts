(*---
description: Evaluates a random set expression, seed 262, number 8198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(\A b12683 \in {2, 1, 3} : FALSE), {3 : b12684 \in 7}} \ ({b12685 \in {x \in 1..3 : x > 1} : FALSE} \cup UNION {{1, 2}, {1, 2}})) \cup ((({2, 1, 3} \cup {1}) \cap {b12686 : b12686 \in {x \in 1..3 : x > 1}}) \ DOMAIN (2 :> 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08198 failed.
    TLC encountered a non-enumerable quantifier bound
    7.
    7
---*)
