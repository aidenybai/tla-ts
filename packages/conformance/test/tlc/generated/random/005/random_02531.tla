(*---
description: Evaluates a random record expression, seed 262, number 2531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), b |-> (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) \subseteq {b3995 : b3995 \in 1..3})] EXCEPT !.a = @ + (CHOOSE b3996 \in {LET b3997 == 2 IN 1, (3 \div 3)} : (~(0 < [a |-> 1, b |-> TRUE])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
