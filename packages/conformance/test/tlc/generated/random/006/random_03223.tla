(*---
description: Evaluates a random int expression, seed 262, number 3223.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03223 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(([[a |-> -1, b |-> TRUE] EXCEPT !.a = (CHOOSE b5118 \in {1} : TRUE)] \ {b5119 \in {b5120 \in {2, 1, 3} : TRUE} : (TRUE <=> FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable.
---*)
