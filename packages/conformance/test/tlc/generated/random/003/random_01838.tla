(*---
description: Evaluates a random bool expression, seed 262, number 1838.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01838 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq([[x \in Nat |-> x + 1] EXCEPT ![1] = 7], LAMBDA p, q : p < q) = (CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE)) <=> (((TRUE \/ FALSE) \/ (~FALSE)) \/ ((3 = -1) /\ (FALSE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.SortSeq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.SortSeq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
