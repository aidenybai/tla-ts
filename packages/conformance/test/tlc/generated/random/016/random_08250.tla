(*---
description: Evaluates a random function expression, seed 262, number 8250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE) @@ ([(1 :> 2) EXCEPT ![3] = 2147483647] @@ [<<5, 6>> EXCEPT ![3] = 2])) @@ (([b12766 \in 2 |-> b12766] @@ [[x \in 1..2 |-> x] EXCEPT ![3] = 3]) @@ [b12767 \in DOMAIN (1 :> 2) |-> (7 % b12767)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 71 to line 14, col 76 of module random_08250
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 109 to line 14, col 116 of module random_08250
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 172 to line 14, col 189 of module random_08250
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the integer 2.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the integer 2.
---*)
