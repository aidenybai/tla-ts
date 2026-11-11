(*---
description: Evaluates a random seq expression, seed 262, number 6589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), (7 \div 3), ((1 :> 2) - 7)), LAMBDA e : e > 0) EXCEPT ![1] = IF ((TRUE /\ 0) <=> (TRUE <=> TRUE)) THEN Len([<<1, 2>> EXCEPT ![1] = 2147483647]) ELSE Len(Append(<<>>, -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06589 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
