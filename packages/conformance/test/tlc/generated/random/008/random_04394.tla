(*---
description: Evaluates a random seq expression, seed 262, number 4394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(([(1 :> 2) EXCEPT ![3] = 3] /\ SubSeq(<<>>, 1, 2147483647)) + Head(Tail(<<1, 2>>))), (((7 % -1) * CASE FALSE -> 2 [] OTHER -> 2) = (IF TRUE THEN 7 ELSE 2147483647 - [a |-> 2, b |-> FALSE]))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 27 of module random_04394
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04394 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 20 to line 14, col 76 of module random_04394
---*)
