(*---
description: Evaluates a random seq expression, seed 262, number 6282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(Len(<<1, 2>>) \div IF TRUE THEN 2147483647 ELSE 7), (IF FALSE THEN 1 ELSE FALSE .. Head(<<1, 2>>))>> \o [<<(FALSE * 2147483647), ({1, 2} * 1)>> EXCEPT ![1] = ((CHOOSE b9667 \in {} : TRUE) + CASE FALSE -> 1 [] OTHER -> 3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06282 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
