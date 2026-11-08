(*---
description: Evaluates a random function expression, seed 262, number 6659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in Nat |-> x + 1] @@ <<1, 2>>))[(CHOOSE b10216 \in {1, 2} : FALSE)] % Head([<<>> EXCEPT ![1] = 1])) :> ([b10217 \in {b10218 : b10218 \in {x \in 1..3 : x > 1}} |-> (b10217 % b10217)])[Head([<<1, 2>> EXCEPT ![1] = 7])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06659 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
