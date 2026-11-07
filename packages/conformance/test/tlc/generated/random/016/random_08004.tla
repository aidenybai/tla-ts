(*---
description: Evaluates a random int expression, seed 262, number 8004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq(Tail(<<2147483647, 0>>), ((3 :> -1) @@ ([a |-> 1] :> 2147483647)), IF (TRUE => FALSE) THEN CASE FALSE -> 3 [] OTHER -> 3 ELSE IF FALSE THEN 0 ELSE 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    3
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    3
---*)
