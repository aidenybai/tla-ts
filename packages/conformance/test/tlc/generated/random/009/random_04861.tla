(*---
description: Evaluates a random seq expression, seed 262, number 4861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((<<(<<5, 6>>)[1], Cardinality({2, 1, 3})>> \o [(<<3, 1, 2>> \o <<>>) EXCEPT ![1] = (3 * 7)]), (((-2) \div (-2)) % ((0 - (1 :> 2)) + Head(<<3, 1, 2>>))), (((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a \in UNION {{b7572 \in [x \in 1..2 |-> x] : TRUE}, UNION {{1, 2}, {1, 2}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04861 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
