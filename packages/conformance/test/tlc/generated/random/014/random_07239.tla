(*---
description: Evaluates a random function expression, seed 262, number 7239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE) @@ ((<<5, 6>> @@ [x \in 1..2 |-> x]) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE))) EXCEPT ![(-([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] = [[a |-> 1] EXCEPT !.a = 3]))] = ((Cardinality(2..1) % LET b11128 == 0 IN b11128) - ((CHOOSE r \in [a : {1}] : TRUE)).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
