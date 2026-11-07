(*---
description: Evaluates a random record expression, seed 262, number 6593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = Len(<<>>)] EXCEPT !.a = ((7 :> TRUE))[IF TRUE THEN 2 ELSE 3]] EXCEPT !.a = @ + Len(SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06593 failed.
    Attempted to apply function:
    (7 :> TRUE)
    to argument 2, which is not in the domain of the function.
---*)
