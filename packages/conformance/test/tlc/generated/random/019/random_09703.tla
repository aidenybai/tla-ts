(*---
description: Evaluates a random set expression, seed 262, number 9703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b15055 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE <=> FALSE)} \cup {b15056 \in ({} \cup FALSE) : (FALSE \/ FALSE)}) \ UNION {((2147483647 .. -1) \cap (SUBSET {1} \ {x \in 1..3 : x > 1})), ({3, 7} \cap DOMAIN <<5, 6>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
