(*---
description: Evaluates a random function expression, seed 262, number 6937.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06937 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10617 \in DOMAIN (2 :> -1) : ({-1 : b10618 \in {1}} \subseteq ([x \in Nat |-> x + 1])[7])) :> (LET b10619 == CASE FALSE -> 0 [] OTHER -> 3 IN IF TRUE THEN b10619 ELSE b10619 :> (CASE TRUE -> 7 [] OTHER -> 2147483647 * (2147483647 - 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06937 failed.
    Attempted to check if the value:
    -1
    is an element of the integer 8
---*)
