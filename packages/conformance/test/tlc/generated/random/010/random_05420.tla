(*---
description: Evaluates a random set expression, seed 262, number 5420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a .. ([a |-> 3, b |-> FALSE]).a), (({1, -1} \ {b8394 : b8394 \in [x \in Nat |-> x + 1]}) \ ((FALSE \cup {x \in 1..3 : x > 1}) \cap ({x \in 1..3 : x > 1} \cap {1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05420 failed.
    TLC encountered a non-enumerable quantifier bound
    [x \in Nat |-> <expression line 14, col 147 to line 14, col 151 of module random_05420>].
    line 14, col 132 to line 14, col 152 of module random_05420
---*)
