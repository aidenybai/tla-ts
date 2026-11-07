(*---
description: Evaluates a random set expression, seed 262, number 2067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b3289 == (-Nat) IN (b3289 + b3289) + CASE (CHOOSE r \in [a : {0} \cup {1}] : TRUE) -> IF TRUE THEN 3 ELSE 0 [] OTHER -> (2147483647 * 3)) .. Cardinality(((CHOOSE r \in [a : {1, 2}] : TRUE) \cap {b3290 \in {1, 2} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
---*)
