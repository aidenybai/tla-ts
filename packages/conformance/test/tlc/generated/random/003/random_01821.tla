(*---
description: Evaluates a random function expression, seed 262, number 1821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) @@ (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) @@ (<<5, 6>> @@ [x \in Nat |-> x + 1]))) EXCEPT ![(-(CASE FALSE -> 2147483647 [] OTHER -> 0 % (1 - 1)))] = (CHOOSE b2888 \in ({2147483647, 2147483647} \cap {2147483647 : b2889 \in {1, 2}}) : [[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = (-3)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01821 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
