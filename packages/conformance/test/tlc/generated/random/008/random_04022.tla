(*---
description: Evaluates a random bool expression, seed 262, number 4022.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04022 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE] - -1)] EXCEPT !.a = ((-[a |-> 1]) \div (2147483647 * 2))] = [(CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) EXCEPT !.a = @ + (CHOOSE b6322 \in ({1, 2} \ 2..1) : (<<3, 1, 2>> = (1 :> 2)))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
