(*---
description: Evaluates a random bool expression, seed 262, number 9603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + LET b14908 == (2147483647 \div 0) IN CASE FALSE -> b14908 [] OTHER -> b14908] \subseteq {IF (\E b14909 \in {1} : FALSE) THEN Cardinality({2, 1, 3}) ELSE (-1 * 2147483647), ([b14910 \in Nat |-> <<1>>])[(7 % 2147483647)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
