(*---
description: Evaluates a random int expression, seed 262, number 2440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3852 \in ([(CHOOSE f \in [{} -> {1, 2}] : TRUE) EXCEPT ![(-1 - 0)] = (<<5, 6>>)[7]] \ {Cardinality({}) : b3853 \in UNION {{2, 1, 3}, {}}}) : (Head(<<[x \in Nat |-> x + 1], 1>>) = (((1 :> 2))[1] .. (2147483647 + 0)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 30 to line 14, col 63 of module random_02440
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<>>
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<>>
    is not enumerable.
---*)
