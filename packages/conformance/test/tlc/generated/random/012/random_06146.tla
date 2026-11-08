(*---
description: Evaluates a random function expression, seed 262, number 6146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(3 :> 7) EXCEPT ![(0 * 0)] = LET b9448 == 3 IN 2] @@ ((<<>> :> 0) @@ [a |-> 7, b |-> FALSE])) @@ (Head(Tail(<<1, 2>>)) :> (IF FALSE THEN 1 ELSE -1 - (-1 - 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 25 of module random_06146
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06146 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    <<>>
---*)
