(*---
description: Evaluates a random record expression, seed 262, number 4894.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04894 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len(<<2, [a |-> 1, b |-> TRUE]>>), b |-> (\E b7614 \in {b7615 : b7615 \in {}} : (TRUE <=> FALSE))] EXCEPT !.a = IF (\A b7616 \in {b7617 \in {2, 1, 3} : TRUE} : ([a |-> 1, b |-> TRUE] = [a |-> 1])) THEN ((\A b7618 \in {1} : TRUE) /\ (~FALSE)) ELSE ([[x \in 1..2 |-> x] EXCEPT ![7] = 1])[([x \in Nat |-> x + 1])[2147483647]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 273 to line 14, col 290 of module random_04894
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04894 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
