(*---
description: Evaluates a random function expression, seed 262, number 2907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(3 :> TRUE) EXCEPT ![IF FALSE THEN 3 ELSE 2] = (3 % 3)] EXCEPT ![Cardinality((2147483647 .. 0))] = IF (~TRUE) THEN (0 - 0) ELSE Head(<<>>)] EXCEPT ![Len([{2, 2} EXCEPT ![1] = Len(<<1>>)])] = {(IF FALSE THEN 1 ELSE 2147483647 % CASE FALSE -> 0 [] OTHER -> 2), IF (\A b4600 \in -1 : FALSE) THEN LET b4601 == 7 IN 3 ELSE ((1 :> 2))[1]}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 28 of module random_02907
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 73 of module random_02907
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02907 failed.
    Attempted to apply EXCEPT construct to the value {2}.
---*)
