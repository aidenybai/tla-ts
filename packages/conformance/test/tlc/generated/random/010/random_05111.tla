(*---
description: Evaluates a random record expression, seed 262, number 5111.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05111 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + Len(Tail(SUBSET {1}))] EXCEPT !.a = @ + (((0 :> 1) @@ <<7, 1>>))[(([a |-> 1]).a * LET b7949 == 7 IN b7949)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05111 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {{}, {1}}
---*)
