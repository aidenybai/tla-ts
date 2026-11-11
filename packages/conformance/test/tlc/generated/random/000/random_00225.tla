(*---
description: Evaluates a random record expression, seed 262, number 225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Cardinality({([a |-> 1, b |-> TRUE]).a : b370 \in {b371 : b371 \in {2, 1, 3}}}) EXCEPT !.a = @ + Cardinality({Head(<<1, 2>>), CASE FALSE -> 0 [] OTHER -> (1 :> 2)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00225 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
