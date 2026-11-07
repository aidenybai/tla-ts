(*---
description: Evaluates a random function expression, seed 262, number 4753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7420 \in DOMAIN ([b7421 \in SUBSET {1} |-> b7421] @@ ((1 :> 2) @@ (1 :> 2))) |-> ((\E b7422 \in UNION {{1, 2}, {}} : (0 < b7422)) * ([[a |-> 1] EXCEPT ![<<1, 2>>] = 3])[([a |-> 1]).a])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
