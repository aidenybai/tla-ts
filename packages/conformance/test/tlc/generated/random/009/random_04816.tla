(*---
description: Evaluates a random set expression, seed 262, number 4816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7510 \in ((DOMAIN [x \in Nat |-> x + 1] \ ({} \ {x \in 1..3 : x > 1})) \cup DOMAIN (CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE)) : (Cardinality((7 .. b7510)) \in {(-2), (CHOOSE b7511 \in {1, 2} : TRUE)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
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
