(*---
description: Evaluates a random seq expression, seed 262, number 8737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(Append(SubSeq(<<3, 1, 2>>, 2, 1), {b13529 \in Nat : FALSE})), (((CHOOSE r \in [a : {1, 2}] : TRUE)).a \div [a |-> LET b13530 == 0 IN b13530, b |-> (\E b13531 \in SUBSET {1} : TRUE)]), ((([a |-> 1, b |-> TRUE] + -1) - (2147483647 \div 7)) \div (Head(<<3, 1, 2>>) \div ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
