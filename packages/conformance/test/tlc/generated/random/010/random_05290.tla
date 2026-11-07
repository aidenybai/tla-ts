(*---
description: Evaluates a random set expression, seed 262, number 5290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {({x \in 1..3 : x > 1} \cap Nat), {b8187 \in <<3, 1, 2>> : FALSE}} \ UNION {(SUBSET {1} \ 1..3), {0 : b8188 \in {1, 2}}}) \cup UNION {{b8189 \in DOMAIN (1 :> 2) : (b8189 = 2147483647)}, {(CHOOSE b8191 \in {x \in 1..3 : x > 1} : FALSE) : b8190 \in {b8192 \in {} : TRUE}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<3, 1, 2>>
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<3, 1, 2>>
    is not enumerable
---*)
