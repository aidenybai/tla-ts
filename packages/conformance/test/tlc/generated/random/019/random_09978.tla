(*---
description: Evaluates a random function expression, seed 262, number 9978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b15516 \in {1, 3} : (TRUE => TRUE)) :> (Len(<<3, 1, 2>>) * (7 * 2))) @@ [(CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE) EXCEPT ![Cardinality((0 .. (1 :> 2)))] = ((3 * 3) \div (3 \div 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09978 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
