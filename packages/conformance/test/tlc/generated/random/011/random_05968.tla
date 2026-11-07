(*---
description: Evaluates a random bool expression, seed 262, number 5968.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05968 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), ((1 :> 2))[1], (-0)) EXCEPT ![1] = LET b9203 == (TRUE % 3) IN (2147483647 * 1)] = Head(Append(SelectSeq([x \in 1..2 |-> x], LAMBDA e : e > 0), IF <<1>> THEN 1 ELSE 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 84 of module random_05968
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05968 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 208 to line 14, col 229 of module random_05968
---*)
