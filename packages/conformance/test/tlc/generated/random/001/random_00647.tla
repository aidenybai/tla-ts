(*---
description: Evaluates a random function expression, seed 262, number 647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([[x \in 1..2 |-> x] EXCEPT ![0] = 3] @@ [[a |-> 1, b |-> TRUE] EXCEPT ![-1] = 2]) EXCEPT ![Cardinality({b1079 \in {x \in 1..3 : x > 1} : FALSE})] = ((-1 + 0) % Cardinality(Nat))] @@ ([b1080 \in {b1081 : b1081 \in Nat} |-> Head(<<3, 1, 2>>)] @@ [b1082 \in {b1083 \in {x \in 1..3 : x > 1} : TRUE} |-> Len(<<>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 37 of module random_00647
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00647 failed.
    Attempted to access record by a non-string argument: -1
---*)
