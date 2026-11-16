(*---
description: Evaluates a random int expression, seed 262, number 3731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = Cardinality({1, 2})] = [a |-> (7 % 2), b |-> ({x \in 1..3 : x > 1} \subseteq SUBSET {1})]) -> ([[<<5, 6>> EXCEPT ![2] = -1] EXCEPT ![(-7)] = IF TRUE THEN FALSE ELSE 2147483647])[IF (\A b5891 \in {x \in 1..3 : x > 1} : FALSE) THEN ([a |-> 1]).a ELSE (2147483647 - -1)] [] OTHER -> ((([x \in Nat |-> x + 1])[7] \div (2147483647 + 2147483647)) + ([(1 :> 2) EXCEPT ![7] = 1])[IF FALSE THEN 3 ELSE 7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03731 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
