(*---
description: Evaluates a random seq expression, seed 262, number 9845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (IF (-1 < 0) THEN ((1 :> 2) @@ [x \in Nat |-> x + 1]) ELSE ([a |-> 1]).a :> (CHOOSE b15284 \in DOMAIN <<5, 6>> : (\A b15285 \in {x \in 1..3 : x > 1} : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09845 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
