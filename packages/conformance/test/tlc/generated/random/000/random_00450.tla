(*---
description: Evaluates a random set expression, seed 262, number 450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b737 \in {0 : b738 \in {1, 2}} : (~FALSE)} \ {(-1), (-1 + 3)}), ((({1} \ {1}) \cup (<<5, 6>>)[2]) \ {LET b740 == 1 IN b739 : b739 \in {b741 : b741 \in {1, 2}}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    6
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    6
    is not enumerable.
---*)
