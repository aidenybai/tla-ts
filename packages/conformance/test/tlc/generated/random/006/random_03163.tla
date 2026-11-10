(*---
description: Evaluates a random set expression, seed 262, number 3163.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03163 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) - (2 + {1})), ((CHOOSE r \in [a : {}] : TRUE)).a} \cup (CASE (<<3, 1, 2>> = 2) -> (7 \div 2147483647) [] OTHER -> Head(<<1>>) .. Len(SelectSeq(<<>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03163 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
