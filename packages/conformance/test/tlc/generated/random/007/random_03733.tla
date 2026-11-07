(*---
description: Evaluates a random bool expression, seed 262, number 3733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<1, 2>> EXCEPT ![1] = 2147483647] \o Append(<<1>>, 0)) = ([b5896 \in Nat |-> b5896] @@ (TRUE /\ FALSE))) <=> ([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = ([x \in 1..2 |-> x])[3]] => ((FALSE /\ TRUE) => (FALSE <=> TRUE)))))
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
