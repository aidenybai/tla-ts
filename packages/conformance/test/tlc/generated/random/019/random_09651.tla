(*---
description: Evaluates a random bool expression, seed 262, number 9651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-LET b14988 == CASE FALSE -> 7 [] OTHER -> b14987 IN ([x \in Nat |-> x + 1])[b14988]) : b14987 \in ((DOMAIN [x \in 1..2 |-> x] \cap (1..3 \ {1})) \subseteq DOMAIN [(1 :> 2) EXCEPT ![0] = 0])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 183 to line 14, col 188 of module random_09651
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09651 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 118 to line 14, col 206 of module random_09651
---*)
