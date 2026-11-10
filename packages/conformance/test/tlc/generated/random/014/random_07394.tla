(*---
description: Evaluates a random function expression, seed 262, number 7394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(IF ({1} \subseteq Nat) THEN ((1 :> 2) @@ <<5, 6>>) ELSE (-3) :> Len((<<3, 1, 2>> \o <<>>))) EXCEPT ![IF (LET b11384 == 2147483647 IN b11384 = (1 % 3)) THEN Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) ELSE ((2 * 2) % IF FALSE THEN -1 ELSE 2)] = CASE (\E b11385 \in {3, [x \in Nat |-> x + 1]} : (-1 \in {1, 2})) -> ([a |-> 0, b |-> [a |-> 1, b |-> TRUE]]).a [] OTHER -> (LET b11386 == 3 IN 0 - (1 * 2))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 107 of module random_07394
    | <<2, 6>>
---*)
