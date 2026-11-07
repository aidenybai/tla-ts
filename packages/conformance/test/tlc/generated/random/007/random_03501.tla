(*---
description: Evaluates a random record expression, seed 262, number 3501.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03501 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF TRUE THEN 2 ELSE 2147483647 * Cardinality({2, 1, 3})), b |-> ((<<1>> \o <<1, 2>>) = ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))] EXCEPT !.a = (CHOOSE b5529 \in {(-1 - 7), Len(<<1, 2>>)} : ([[a |-> 1] EXCEPT !.a = @ + -1] = [[a |-> 1] EXCEPT !.a = b5529]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
