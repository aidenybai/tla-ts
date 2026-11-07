(*---
description: Evaluates a random set expression, seed 262, number 3765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(LET b5935 == b5934 IN b5935 - (-b5934)) : b5934 \in ({b5936 : b5936 \in {1}} \cup {7, 3})} \cup ({b5937 \in {b5938 : b5938 \in {2, 1, 3}} : (2 = 7)} \cup LET b5939 == (-1) IN CASE TRUE -> b5939 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {2, 6, 14}
    and T:
    -1
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {2, 6, 14}
    and T:
    -1
    are not both enumerable
---*)
