(*---
description: Evaluates a random seq expression, seed 262, number 3801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<((-1 * TRUE) % Head(<<1>>)), Cardinality(DOMAIN [x \in 1..2 |-> x])>>, CASE [SubSeq(<<1, 2>>, 1, -1) EXCEPT ![1] = (7 - 3)] -> ((3 \div 1) - (-2)) [] OTHER -> (<<2, [x \in 1..2 |-> x]>> \o Append(<<1>>, 2147483647)), CASE ((2..1 \subseteq 2..1) <=> (<<1>> = <<5, 6>>)) -> (IF TRUE THEN <<3, 1, 2>> ELSE 1 % (<<3, 1, 2>> = <<5, 6>>)) [] OTHER -> Tail([<<1>> EXCEPT ![1] = 2])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
