(*---
description: Evaluates a random function expression, seed 262, number 1515.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01515 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b2412 \in (CASE FALSE -> 3 [] OTHER -> 2147483647 .. CASE FALSE -> 2147483647 [] OTHER -> 0) |-> Cardinality({b2413 \in 1..3 : TRUE})] EXCEPT ![((CHOOSE r \in [a : {1}] : TRUE)).a] = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = [a |-> 1, b |-> TRUE]]).a - ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 151 of module random_01515
    | <<>>
---*)
