(*---
description: Evaluates a random seq expression, seed 262, number 4580.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04580 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2147483647 = 3) <=> (~FALSE)) \/ ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [a |-> 3, b |-> TRUE])) EXCEPT !.a = (([[x \in Nat |-> x + 1] EXCEPT ![7] = 0])[(2 \in {})] \div (CASE TRUE -> 2 [] OTHER -> 7 + ([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04580 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
