(*---
description: Evaluates a random record expression, seed 262, number 5465.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05465 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (-1 \div <<5, 6>>), b |-> ({1} \cup {1})] EXCEPT !.a = CASE ({x \in 1..3 : x > 1} = 2147483647) -> (2147483647 + -1) [] OTHER -> (<<5, 6>>)[2147483647]] EXCEPT !.a = (CHOOSE b8456 \in UNION {DOMAIN <<5, 6>>, ({1, 2} \ Nat)} : (\A b8457 \in ({x \in 1..3 : x > 1} \cup {}) : ([a |-> 1, b |-> TRUE] = [a |-> 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
