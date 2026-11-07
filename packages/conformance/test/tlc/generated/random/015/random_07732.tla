(*---
description: Evaluates a random set expression, seed 262, number 7732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11925 \in Tail(Tail(Append(<<1, 2>>, <<>>))) : Cardinality({(0 % b11926) : b11926 \in [a |-> 2, b |-> TRUE]})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<<<>>>>
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<<<>>>>
    is not enumerable
---*)
