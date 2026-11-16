(*---
description: Evaluates a random set expression, seed 262, number 1044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = Cardinality(DOMAIN [x \in Nat |-> x + 1])], ({CASE FALSE -> 2 [] OTHER -> 2 : b1676 \in ({2, 1, 3} \ {x \in 1..3 : x > 1})} \cup ((2147483647 = 2147483647) <=> (\E b1677 \in {} : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01044 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
