(*---
description: Evaluates a random function expression, seed 262, number 7186.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07186 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b11038 \in {b11039 \in [x \in 1..2 |-> x] : TRUE} |-> (b11038 * b11038)] EXCEPT ![(IF FALSE THEN 1 ELSE 0 + (2147483647 * 3))] = Len(({2, 1, 3} = {}))] @@ ((Head(<<3, 1, 2>>) % ((1 :> 2))[3]) :> Len(SubSeq(<<3, 1, 2>>, TRUE, 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07186 failed.
    2178:0 Overflow when computing 2147483647*3
---*)
