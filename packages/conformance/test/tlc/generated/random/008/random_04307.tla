(*---
description: Evaluates a random function expression, seed 262, number 4307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b6788 \in ({} \cap {1, 2}) |-> IF -1 THEN 7 ELSE b6788] EXCEPT ![IF (TRUE /\ FALSE) THEN (2 * 1) ELSE (-2147483647)] = IF (Nat \ Nat) THEN CASE [a |-> 1] -> 2 [] OTHER -> 0 ELSE ((1 :> 2))[[a |-> 1, b |-> TRUE]]] EXCEPT ![Head(Append(<<7, 1>>, (7 \div 0)))] = ((Cardinality({2, 1, 3}) % (CHOOSE b6789 \in 1..3 : TRUE)) + (-CASE FALSE -> 3 [] OTHER -> 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 73 of module random_04307
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
