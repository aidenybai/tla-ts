(*---
description: Evaluates a random function expression, seed 262, number 3726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b5880 \in {(CHOOSE b5882 \in Nat : TRUE) : b5881 \in {1, 2}} |-> ((3 = b5880) <=> (2..1 = {x \in 1..3 : x > 1}))] EXCEPT ![([[(1 :> 2) EXCEPT ![7] = 3] EXCEPT ![Len(<<>>)] = (3 - 0)] % [a |-> (-1 - 1), b |-> (\A b5883 \in 1..3 : TRUE)])] = IF (UNION {{2, 1, 3}, [a |-> 1, b |-> TRUE]} = {-1 : b5884 \in {1}}) THEN (Len(<<>>) + (0 + <<3, 1, 2>>)) ELSE ((FALSE)[<<3, 1, 2>>] * (1 % 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03726 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 30 to line 14, col 56 of module random_03726
---*)
