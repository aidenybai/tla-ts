(*---
description: Evaluates a random set expression, seed 262, number 7912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12203 \in (LET b12204 == (7 - 7) IN Head(<<3, 1, 2>>) % Head((<<1>> \o <<>>))) : ([a |-> Head(<<1, 2>>), b |-> ({2, 1, 3} = {1})] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    0
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    0
    is not enumerable
---*)
