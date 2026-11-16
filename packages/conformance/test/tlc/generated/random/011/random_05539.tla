(*---
description: Evaluates a random function expression, seed 262, number 5539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b8566 \in ({2147483647 : b8567 \in 2..1} \ (TRUE <=> TRUE)) |-> Len([<<3, 1, 2>> EXCEPT ![1] = b8566])] EXCEPT ![Len(Tail([<<3, 1, 2>> EXCEPT ![1] = 2]))] = CASE ((-1 < -1) /\ (7 < 3)) -> [[[a |-> 1] EXCEPT !.a = {x \in 1..3 : x > 1}] EXCEPT !.a = ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])] [] OTHER -> Cardinality(UNION {{2, 1, 3}, {1, 2}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 120 of module random_05539
    | <<>>
---*)
