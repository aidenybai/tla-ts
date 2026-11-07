(*---
description: Evaluates a random set expression, seed 262, number 9649.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09649 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]), (Len(<<1>>) .. IF TRUE THEN 3 ELSE 7)} \cup Len(Append(<<2147483647, -1>>, LET b14986 == -1 IN <<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    3
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    3
    are not both enumerable
---*)
