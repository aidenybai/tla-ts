(*---
description: Evaluates a random function expression, seed 262, number 5099.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7933 \in (-(([a |-> 1, b |-> TRUE]).a + (-[a |-> 1]))) |-> IF ({b7934 \in {} : b7933} \subseteq ({x \in 1..3 : x > 1} \cap SUBSET {1})) THEN (LET b7935 == 2147483647 IN 7 % (CHOOSE b7936 \in {1} : TRUE)) ELSE ((2 + 7) % (b7933 + <<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05099 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
