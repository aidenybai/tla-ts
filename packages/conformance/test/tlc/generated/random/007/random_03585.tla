(*---
description: Evaluates a random set expression, seed 262, number 3585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b5653 == Cardinality(UNION {Nat, {1}}) IN (-(-<<5, 6>>)), (((CHOOSE f \in [2..1 -> 1..2] : TRUE) @@ ((1 :> 2) @@ [x \in 1..2 |-> x])))[((2 * 2147483647) \div (3 - 0))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
