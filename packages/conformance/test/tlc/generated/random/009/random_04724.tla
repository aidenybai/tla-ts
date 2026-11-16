(*---
description: Evaluates a random function expression, seed 262, number 4724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Append(<<1, 2>>, 7)) :> CASE (\A b7384 \in {} : TRUE) -> (7 + -1) [] OTHER -> Cardinality({1})) @@ (((CHOOSE f \in [2..1 -> {1}] : TRUE) @@ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) @@ ((CHOOSE f \in [1..2 -> 2..1] : TRUE) @@ [b7385 \in {1, 2} |-> 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04724 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
