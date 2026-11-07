(*---
description: Evaluates a random function expression, seed 262, number 141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b221 \in (DOMAIN [b222 \in 1..3 |-> 2] \cup UNION {(1 .. 3), (2..1 \cup SUBSET {1})}) |-> (IF ({x \in 1..3 : x > 1} \subseteq {}) THEN (-1 % b221) ELSE CASE TRUE -> b221 [] OTHER -> b221 % Head(<<b221, b221>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    {1}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    {1}
---*)
