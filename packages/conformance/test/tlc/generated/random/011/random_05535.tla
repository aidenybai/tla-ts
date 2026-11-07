(*---
description: Evaluates a random int expression, seed 262, number 5535.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05535 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((DOMAIN [x \in Nat |-> x + 1] \cap (SUBSET {1} \ {1}))) \div Len(<<Len(<<3, 1, 2>>), CASE <<1, 2>> -> 7 [] OTHER -> 7>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
