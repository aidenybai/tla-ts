(*---
description: Evaluates a random bool expression, seed 262, number 4305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append([<<>> EXCEPT ![1] = 0], (-1 * 0)) = ((2147483647 :> 7) @@ ([x \in Nat |-> x + 1] @@ Nat))) <=> ((Tail(<<1>>) \div (CHOOSE b6786 \in {1} : TRUE)) = Cardinality(UNION {SUBSET {1}, Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 29 of module random_04305
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04305 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
