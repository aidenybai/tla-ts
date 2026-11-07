(*---
description: Evaluates a random function expression, seed 262, number 9166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((7 * 0) :> CASE FALSE -> -1 [] OTHER -> [x \in Nat |-> x + 1]) @@ (([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))) EXCEPT ![(IF (1..3 \subseteq <<3, 1, 2>>) THEN ([a |-> 1]).a ELSE (0 \div 2) :> Len(Append(<<1>>, 7)))] = ((Cardinality({x \in 1..3 : x > 1}) - (-1)) * (Head(TRUE) * (CHOOSE b14234 \in {2, 1, 3} : TRUE)))])
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
