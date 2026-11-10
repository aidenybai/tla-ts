(*---
description: Evaluates a random bool expression, seed 262, number 5407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b8379 \in {(-(CHOOSE b8380 \in SUBSET {1} : TRUE)), ((0 * 2) - IF FALSE THEN 7 ELSE 2)} : ((Cardinality(Nat) * ([x \in 1..2 |-> x])[-1]) < Cardinality(SelectSeq(<<1>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05407 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
