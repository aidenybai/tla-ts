(*---
description: Evaluates a random seq expression, seed 262, number 6092.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06092 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<((CHOOSE r \in [a : 1..2] : TRUE) + Cardinality({})), LET b9377 == (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE) IN (3 * 3)>>, CASE ({2, 3} = {2147483647, 2147483647}) -> (Cardinality(Nat) \div (2 % -1)) [] OTHER -> ((CHOOSE f \in [{1, 2} -> {}] : TRUE))[(2 * 1)]))
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
