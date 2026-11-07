(*---
description: Evaluates a random seq expression, seed 262, number 2231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SubSeq((<<>> \o <<>>), (2 - 2), ({2, 1, 3} - 7)), ([b3507 \in {1} |-> b3507])[LET b3508 == -1 IN {1, 2}]) EXCEPT ![1] = ((CASE FALSE -> 2 [] OTHER -> {1} * (-2)) * CASE (TRUE => TRUE) -> (CHOOSE b3509 \in 2..1 : FALSE) [] OTHER -> (2147483647 :> 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
