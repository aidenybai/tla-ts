(*---
description: Evaluates a random set expression, seed 262, number 7340.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07340 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CASE TRUE -> 3 [] OTHER -> -1 + IF FALSE THEN 1 ELSE 2), (((1 :> 2) @@ [x \in Nat |-> x + 1]))[[a |-> 2147483647, b |-> FALSE]]} \cap LET b11297 == Len([<<1, 2>> EXCEPT ![1] = <<>>]) IN (-(b11297 + b11297))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07340 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
