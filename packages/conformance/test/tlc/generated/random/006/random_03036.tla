(*---
description: Evaluates a random set expression, seed 262, number 3036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b4827 \in UNION {(Nat \ {x \in 1..3 : x > 1}), {b4828 \in {1} : FALSE}} |-> CASE (FALSE /\ FALSE) -> (CHOOSE b4829 \in {1} : FALSE) [] OTHER -> [<<1, 2>> EXCEPT ![1] = -1]] \ (DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![-1] = 2] \ {Cardinality({1}), (CHOOSE f \in [{1} -> 1..2] : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 202 to line 14, col 222 of module random_03036
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
