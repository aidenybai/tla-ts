(*---
description: Evaluates a random function expression, seed 262, number 1829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 2147483647 ELSE 0 :> ({1} \div [a |-> 1])) @@ (([a |-> 1, b |-> TRUE] @@ <<5, 6>>) @@ [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1])) @@ [b2895 \in ((CHOOSE b2896 \in SUBSET {1} : b2896) .. IF [a |-> 1] THEN 7 ELSE 3) |-> Head([FALSE EXCEPT !.a = @ + {1}])]))
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
