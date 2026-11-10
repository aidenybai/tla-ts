(*---
description: Evaluates a random set expression, seed 262, number 3648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b5770 \in {1} : FALSE) .. CASE FALSE -> 1 [] OTHER -> 0) \cap UNION {UNION {2..1, [a |-> 1, b |-> TRUE]}, DOMAIN [x \in Nat |-> x + 1]}) \ {(IF b5771 THEN 0 ELSE <<3, 1, 2>> \div LET b5772 == 2147483647 IN 1) : b5771 \in ({2147483647 : b5773 \in 2..1} = {2147483647, 0})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03648 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_03648
---*)
