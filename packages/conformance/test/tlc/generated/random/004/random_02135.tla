(*---
description: Evaluates a random set expression, seed 262, number 2135.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02135 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality(([a |-> 1, b |-> TRUE] \cup {1})) : b3380 \in ({2, 2} \cup ({2, 1, 3} \cap {x \in 1..3 : x > 1}))} \cup (((2147483647 .. 2) \cap UNION {2..1, Nat}) \cup {b3381 \in (0 .. [a |-> 1, b |-> TRUE]) : ({1} \subseteq {})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    [a |-> 1, b |-> TRUE]
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    [a |-> 1, b |-> TRUE]
    are not both enumerable
---*)
