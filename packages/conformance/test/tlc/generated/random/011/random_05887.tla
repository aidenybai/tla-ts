(*---
description: Evaluates a random set expression, seed 262, number 5887.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05887 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9088 \in (((<<>> \div 7) + (7 * 7)) .. ((CHOOSE r \in [a : 2..1] : TRUE)).a) : ((~(TRUE => FALSE)) <=> ((0 % 0) \in ({1, 2} \cap {})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05887 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
