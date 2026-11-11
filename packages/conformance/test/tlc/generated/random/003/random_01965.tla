(*---
description: Evaluates a random bool expression, seed 262, number 1965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<5, 6>> \cap {1, 2}) = {{x \in 1..3 : x > 1} : b3108 \in {x \in 1..3 : x > 1}}) \/ ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] = [[a |-> 1] EXCEPT !.a = 1])) = ((Head([x \in 1..2 |-> x]) * (2147483647 \div 3)) @@ (LET b3109 == 0 IN 0 :> Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01965 failed.
    Attempted to check set membership in a tuple value.
---*)
