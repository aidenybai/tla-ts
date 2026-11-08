(*---
description: Evaluates a random bool expression, seed 262, number 1894.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01894 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + CASE (\A b2976 \in {2, 1, 3} : TRUE) -> Len(<<1>>) [] OTHER -> Head(<<3, 1, 2>>)] = [a |-> (Cardinality([x \in Nat |-> x + 1]) % (~TRUE)), b |-> ({2, 1..3} \subseteq (Nat \ {1, 2}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01894 failed.
    2181:0 Attempted to compute cardinality of the value
    [x \in Nat |-> <expression line 14, col 198 to line 14, col 202 of module random_01894>]
---*)
