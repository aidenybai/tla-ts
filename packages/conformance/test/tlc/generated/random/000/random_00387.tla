(*---
description: Evaluates a random function expression, seed 262, number 387.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00387 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (3 = 0) THEN (0 * 7) ELSE Head(<<3, 1, 2>>) - CASE (Nat = Nat) -> SubSeq(2, 2147483647, 3) [] OTHER -> ([a |-> 1, b |-> TRUE]).a) :> (CHOOSE b636 \in UNION {(2 < [a |-> 1]), ({1} \ {})} : ({<<3, 1, 2>>, 1} = UNION {{2, 1, 3}, {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    2
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    2
---*)
