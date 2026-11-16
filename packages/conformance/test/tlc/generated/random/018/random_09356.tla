(*---
description: Evaluates a random set expression, seed 262, number 9356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b14524 == (CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) IN ((b14524 + <<1, 2>>) - Tail(<<1, 2>>)) .. (IF (TRUE <=> FALSE) THEN ([x \in 1..2 |-> x] + 7) ELSE Head(<<>>) % CASE (7 = 3) -> (0 % 7) [] OTHER -> (2 * (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09356 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
