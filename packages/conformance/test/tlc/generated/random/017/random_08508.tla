(*---
description: Evaluates a random bool expression, seed 262, number 8508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b13181 \in {b13182 \in {1} : TRUE} : LET b13183 == 2147483647 IN [a |-> 1, b |-> TRUE]) \/ ((CHOOSE r \in [a : {1}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1])) <=> (UNION {(3 .. 2147483647), (2 = 7)} = ((Nat \cap {1}) \cap ({2, 1, 3} \cup {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 19 to line 14, col 107 of module random_08508
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 19 to line 14, col 107 of module random_08508
---*)
