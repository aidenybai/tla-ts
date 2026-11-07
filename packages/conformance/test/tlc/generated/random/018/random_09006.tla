(*---
description: Evaluates a random record expression, seed 262, number 9006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (LET b13986 == 7 IN 2 \div CASE FALSE -> -1 [] OTHER -> 2), b |-> ((FALSE \/ TRUE) <=> (2..1 = {2, 1, 3}))] EXCEPT !.a = (Cardinality({0 : b13987 \in {x \in 1..3 : x > 1}}) % ((7 % <<1>>) \div IF TRUE THEN <<1>> ELSE 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
