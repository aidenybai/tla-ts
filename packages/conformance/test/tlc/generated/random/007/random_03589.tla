(*---
description: Evaluates a random bool expression, seed 262, number 3589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b5659 == LET b5660 == Head(<<1>>) IN (7 + b5660) IN LET b5661 == (3 \div {1, 2}) IN (-b5661) \in ((CASE FALSE -> 2147483647 [] OTHER -> 7 .. CASE TRUE -> 0 [] OTHER -> 2147483647) \ DOMAIN (<<5, 6>> @@ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03589 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
