(*---
description: Evaluates a random function expression, seed 262, number 3904.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03904 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([[x \in Nat |-> x + 1] EXCEPT ![2] = 2] @@ [b6147 \in 1..3 |-> b6147]) @@ ((CHOOSE b6148 \in {1} : TRUE) :> ([x \in Nat |-> x + 1])[-1])) EXCEPT ![[[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + IF FALSE THEN 3 ELSE 7] EXCEPT !.a = @ + (Len(<<1, 2>>) - (0 * 2))]] = Head((<<2147483647, 7>> \o [<<1, 2>> EXCEPT ![1] = 1]))])
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
