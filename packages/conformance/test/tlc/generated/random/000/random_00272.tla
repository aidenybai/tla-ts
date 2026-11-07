(*---
description: Evaluates a random int expression, seed 262, number 272.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00272 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b461 \in (((2..1 \cap 2..1) \cup UNION {SUBSET {1}, Nat}) \ ([b462 \in <<1, 2>> |-> -1] @@ (<<5, 6>> @@ <<5, 6>>))) : (((1 \div 2147483647) < Cardinality({2, 1, 3})) <=> ((<<1, 2>> = SUBSET {1}) <=> (0 < b461)))))
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
