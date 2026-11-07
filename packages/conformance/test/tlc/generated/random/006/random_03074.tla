(*---
description: Evaluates a random set expression, seed 262, number 3074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4877 \in (({b4878 \in 2..1 : FALSE} \cup (SUBSET {1} \cup {1})) \ {b4879 \in {b4880 \in {2, 1, 3} : FALSE} : (FALSE /\ TRUE)}) : (\A b4881 \in UNION {{b4882 \in 1..3 : [a |-> 1, b |-> TRUE]}, (-1 .. 1)} : Tail(SubSeq(2147483647, 7, 3)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 186 to line 14, col 206 of module random_03074
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 186 to line 14, col 206 of module random_03074
---*)
