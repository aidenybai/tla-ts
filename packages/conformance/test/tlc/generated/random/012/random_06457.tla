(*---
description: Evaluates a random int expression, seed 262, number 6457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((CHOOSE b9937 \in {b9938 : b9938 \in {1}} : ([a |-> 1] = [a |-> 1, b |-> TRUE])) < CASE (<<1, 2>> = [x \in Nat |-> x + 1]) -> (2 * 7) [] OTHER -> (Nat \cap {x \in 1..3 : x > 1})) THEN ((Cardinality(Nat) % [<<3, 1, 2>> EXCEPT ![1] = 0]) - (Head(<<3, 1, 2>>) + ([a |-> 1, b |-> TRUE]).a)) ELSE ((CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE))[((FALSE :> 0))[(2 % 7)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06457 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 98 of module random_06457
---*)
