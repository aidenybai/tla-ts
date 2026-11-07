(*---
description: Evaluates a random set expression, seed 262, number 4767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([b7447 \in UNION {{1, 2}, [a |-> 1, b |-> TRUE]} |-> LET b7448 == 3 IN 0] @@ [b7449 \in {2147483647, 0} |-> (0 + b7449)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    {1, 2}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    {1, 2}
---*)
