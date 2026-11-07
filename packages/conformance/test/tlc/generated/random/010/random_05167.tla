(*---
description: Evaluates a random function expression, seed 262, number 5167.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05167 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8015 \in (({0 : b8016 \in {1}} \cup UNION {{2, 1, 3}, FALSE}) \cap (DOMAIN <<5, 6>> \cup UNION {2..1, {1, 2}})) |-> Len(SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean FALSE with non-boolean:
    {1, 2, 3}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean FALSE with non-boolean:
    {1, 2, 3}
---*)
