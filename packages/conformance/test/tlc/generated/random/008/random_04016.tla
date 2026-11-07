(*---
description: Evaluates a random set expression, seed 262, number 4016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b6304 \in [(1 :> 2) EXCEPT ![7] = 7] : (SUBSET {1} = SUBSET {1})} \cup {b6305 \in ({1, 2} \cup 2..1) : (~TRUE)}), {Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) : b6306 \in ({b6307 \in {1} : TRUE} \cup ({x \in 1..3 : x > 1} \cup {2, 1, 3}))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 42 of module random_04016
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<2>>
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<2>>
    is not enumerable
---*)
