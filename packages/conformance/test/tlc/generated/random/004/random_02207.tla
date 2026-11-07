(*---
description: Evaluates a random function expression, seed 262, number 2207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3470 \in ({Len(<<1>>), CASE FALSE -> 2 [] OTHER -> <<1>>} \cup SortSeq(<<2, 3>>, LAMBDA p, q : p < q)) |-> (Len(SubSeq(<<1, 2>>, 0, b3470)) \div IF (~FALSE) THEN (CHOOSE b3471 \in {2, 1, 3} : TRUE) ELSE (-1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<1>> with the value:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<1>> with the value:
    1
---*)
