(*---
description: Evaluates a random function expression, seed 262, number 9229.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09229 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b14324 \in ((CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) @@ (3 :> -1)) |-> (Cardinality(2..1) % Head(<<1, 2>>))] @@ (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    The domains of formal parameters must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    The domains of formal parameters must be enumerable.
---*)
