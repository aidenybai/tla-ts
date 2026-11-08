(*---
description: Evaluates a random int expression, seed 262, number 9564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([([x \in 1..2 |-> x] @@ <<5, 6>>) EXCEPT ![(7 % 2147483647)] = [<<5, 6>> EXCEPT !.a = 0]])[((3 - 3) % (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))] \div (((CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))[Head(<<1, 2>>)] + ([a |-> -1, b |-> FALSE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 49 of module random_09564
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09564 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
