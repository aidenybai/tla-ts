(*---
description: Evaluates a random set expression, seed 262, number 1925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3022 \in UNION {({b3023 \in 1..3 : TRUE} \ {b3024 \in {2, 1, 3} : FALSE}), DOMAIN [b3025 \in Nat |-> b3025]} : IF (Head(<<1, 2>>) \in {b3022, 7}) THEN Cardinality(({1, 2} \cap SUBSET {1})) ELSE CASE (Nat \subseteq Nat) -> Len(<<1>>) [] OTHER -> (-b3022)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2, 3}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2, 3}
---*)
