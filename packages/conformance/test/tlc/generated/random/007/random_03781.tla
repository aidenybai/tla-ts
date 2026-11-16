(*---
description: Evaluates a random record expression, seed 262, number 3781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = LET b5967 == -1 IN 2] EXCEPT !.a = [(-1 :> -1) EXCEPT ![IF TRUE THEN 7 ELSE 0] = ([a |-> 1]).a]] EXCEPT !.a = Len(SelectSeq(Tail(<<>>), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 113 to line 14, col 120 of module random_03781
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03781 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
