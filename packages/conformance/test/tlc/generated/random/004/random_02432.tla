(*---
description: Evaluates a random seq expression, seed 262, number 2432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<(((1 :> 2) \div 1) * {1 : b3837 \in {1, 2}}), LET b3838 == (-0) IN (-b3838)>>, (-((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE))[(3 \div 2147483647)]), (((1 \in SUBSET {1}))[(CHOOSE b3839 \in SUBSET {1} : FALSE)] * (CHOOSE b3840 \in UNION {{x \in 1..3 : x > 1}, 1..3} : (b3840 \in {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02432 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
