(*---
description: Evaluates a random function expression, seed 262, number 6442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ [b9911 \in {x \in 1..3 : x > 1} |-> -1]) EXCEPT ![LET b9912 == (-7) IN (CHOOSE b9913 \in {1, 2} : FALSE)] = ((-1 + -1) - Cardinality(2..1))] EXCEPT ![((CASE FALSE -> 3 [] OTHER -> Nat * (<<5, 6>>)[-1]) % CASE (FALSE <=> TRUE) -> CASE FALSE -> 2147483647 [] OTHER -> 3 [] OTHER -> Head(<<1, 2>>))] = (((1 * 3) * IF [a |-> 1] THEN 7 ELSE 3) \div ([[a |-> 1] EXCEPT !.a = 7]).a)])
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
