(*---
description: Evaluates a random record expression, seed 262, number 9544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> [[a |-> 1] EXCEPT !.a = -1], b |-> (3 = -1)] EXCEPT !.a = Cardinality({2..1, 1})] = [a |-> ((2 - 2) \div IF TRUE THEN 3 ELSE 0), b |-> ({b14829 : b14829 \in {}} = [a |-> -1, b |-> TRUE])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    {}
---*)
