(*---
description: Evaluates a random int expression, seed 262, number 4969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7740 \in (({b7741 : b7741 \in {x \in 1..3 : x > 1}} \ DOMAIN (1 :> 2)) \cap (LET b7742 == 0 IN b7742 .. IF TRUE THEN 3 ELSE -1)) : (UNION {(CHOOSE r \in [a : {0} \cup {1}] : TRUE), [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + [a |-> 1, b |-> TRUE]]} = {(2 * b7740), Cardinality({})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
