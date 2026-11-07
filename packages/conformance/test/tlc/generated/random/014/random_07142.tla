(*---
description: Evaluates a random function expression, seed 262, number 7142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b10967 \in (UNION {{x \in 1..3 : x > 1}, 2..1} \cap {b10968 \in {1, 2} : TRUE}) |-> ((<<5, 6>>)[b10967] \div ([x \in Nat |-> x + 1])[0])] EXCEPT ![(CHOOSE b10969 \in (DOMAIN [x \in 1..2 |-> x] \cup (3 .. 3)) : ([b10970 \in {x \in 1..3 : x > 1} |-> 1] @@ [b10971 \in Nat |-> b10969]))] = IF ((0 + -1) < IF FALSE THEN 2147483647 ELSE 3) THEN ([[a |-> 1] EXCEPT !.a = @ + 0]).a ELSE ((<<1>> = (1 :> 2)) \/ (<<3, 1, 2>> = 2147483647))])
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
