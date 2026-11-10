(*---
description: Evaluates a random record expression, seed 262, number 6472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([(CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE) EXCEPT ![CASE FALSE -> 0 [] OTHER -> 2147483647] = SelectSeq(<<1>>, LAMBDA e : e > 0)])[Len([<<3, 1, 2>> EXCEPT ![1] = 7])], b |-> ((([x \in 1..2 |-> x] @@ <<3, 1, 2>>))[(TRUE)[2]] < ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 66 of module random_06472
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06472 failed.
    Attempted to apply function:
    <<0>>
    to argument 3, which is not in the domain of the function.
---*)
