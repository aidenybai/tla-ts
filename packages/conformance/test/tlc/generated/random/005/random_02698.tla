(*---
description: Evaluates a random bool expression, seed 262, number 2698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((CASE FALSE -> 2147483647 [] OTHER -> <<1>> < (3 \div 0)) <=> ((TRUE \/ FALSE) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))) THEN ((-([x \in 1..2 |-> x])[7]) * ([[a |-> 1] EXCEPT !.a = TRUE]).a) ELSE Cardinality((DOMAIN (1 :> 2) \ UNION {Nat, {}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
