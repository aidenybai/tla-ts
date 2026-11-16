(*---
description: Evaluates a random function expression, seed 262, number 1826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({x \in 1..3 : x > 1} = [a |-> 1, b |-> TRUE]) -> (2 + -1) [] OTHER -> CASE TRUE -> -1 [] OTHER -> 7 + LET b2894 == (2147483647 % 3) IN CASE TRUE -> b2894 [] OTHER -> b2894) :> (([<<5, 6>> EXCEPT ![0] = 2] @@ ([x \in Nat |-> x + 1] @@ (1 :> 2))))[(Head(<<1, 2>>) + (3 * 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01826 failed.
    Attempted to check equality of the set {2, 3} with the value:
    [a |-> 1, b |-> TRUE]
---*)
