(*---
description: Evaluates a random function expression, seed 262, number 7886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = {1, 2}] @@ (2 :> 2)) @@ [(CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![(FALSE)[-1]] = DOMAIN <<5, 6>>]) @@ [b12174 \in {b12175 \in ({1} \cap {}) : (TRUE <=> FALSE)} |-> ([[x \in 1..2 |-> x] EXCEPT ![7] = 3])[(2147483647 % 3)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 2 with non-integer:
    "a"
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 2 with non-integer:
    "a"
---*)
