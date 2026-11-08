(*---
description: Evaluates a random int expression, seed 262, number 4409.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04409 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b6938 \in {(([x \in Nat |-> x + 1] @@ <<5, 6>>))[(<<5, 6>>)[-1]], ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a} : ((~(b6938 = {})) /\ ((b6938 % 2147483647) \in (SUBSET {1} \cup Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04409 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
