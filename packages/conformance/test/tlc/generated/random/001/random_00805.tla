(*---
description: Evaluates a random bool expression, seed 262, number 805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (2..1 => TRUE) THEN (-1 + [a |-> 1]) ELSE (0 + 2) .. ((2 :> 3))[(1 + 7)]) = {(-[[x \in Nat |-> x + 1] EXCEPT ![2] = -1]), Len(SelectSeq(<<1>>, LAMBDA e : e > 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00805 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form i..j.
    line 14, col 22 to line 14, col 33 of module random_00805
---*)
