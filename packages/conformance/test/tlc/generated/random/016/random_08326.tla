(*---
description: Evaluates a random function expression, seed 262, number 8326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(<<1, -1>>) :> Len(Tail([x \in Nat |-> x + 1]))) @@ (((<<1>> - 3) + Len(<<1, 2>>)) :> (CASE TRUE -> (1 :> 2) [] OTHER -> TRUE + CASE <<>> -> 2147483647 [] OTHER -> 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08326 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Tail(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
