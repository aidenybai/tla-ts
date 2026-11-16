(*---
description: Evaluates a random int expression, seed 262, number 2941.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02941 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(<<7, 7>>) * (SubSeq(<<>>, [x \in 1..2 |-> x], -1) * (-1 * 3))) + (((CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE) @@ [b4660 \in {2, 1, 3} |-> b4660]))[(CASE TRUE -> 0 [] OTHER -> 1 % (-1 - 2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02941 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
