(*---
description: Evaluates a random int expression, seed 262, number 6810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [a |-> (0 % 2), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])]) -> ((Len(<<1, 2>>) % (7 \div 0)) * ((-1) * ((1 :> 2))[[x \in Nat |-> x + 1]])) [] OTHER -> ((-([a |-> 1, b |-> TRUE]).a) - Cardinality(DOMAIN [x \in Nat |-> x + 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06810 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
