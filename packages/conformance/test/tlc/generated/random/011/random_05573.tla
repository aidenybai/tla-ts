(*---
description: Evaluates a random set expression, seed 262, number 5573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len([a |-> 2, b |-> TRUE]), (CHOOSE b8625 \in DOMAIN [x \in 1..2 |-> x] : UNION {{x \in 1..3 : x > 1}, b8625})} \ UNION {UNION {({1} \cap Nat), {b8626 \in {1, 2} : FALSE}}, [b8627 \in {3, 3} |-> ((1 :> 2))[b8627]]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05573 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 2, b |-> TRUE]
---*)
