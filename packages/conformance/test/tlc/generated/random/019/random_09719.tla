(*---
description: Evaluates a random set expression, seed 262, number 9719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b15078 \in {1, 2} : TRUE) + (-7)) % ([a |-> 3, b |-> FALSE] \div CASE FALSE -> 1 [] OTHER -> 0)), (Head(SubSeq(<<>>, 2, 1)) + Len(<<1, 3>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09719 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
