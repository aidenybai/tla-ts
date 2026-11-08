(*---
description: Evaluates a random bool expression, seed 262, number 3529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = CASE TRUE -> 3 [] OTHER -> 2] EXCEPT !.a = Cardinality(UNION {1..3, 2..1})] % Cardinality([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ([x \in Nat |-> x + 1])[7]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03529 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 9]
---*)
