(*---
description: Evaluates a random bool expression, seed 262, number 9265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([a |-> 7, b |-> TRUE] = ([a |-> 1, b |-> TRUE] @@ <<>>)) THEN (CHOOSE b14380 \in {3, 2} : (0 < b14380)) ELSE Cardinality({SUBSET {1}, 3}) = (CHOOSE b14381 \in {([x \in Nat |-> x + 1])[1], (2 - -1)} : (Head(<<>>) = (<<5, 6>>)[3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 3 with non-integer:
    {{}, {1}}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 3 with non-integer:
    {{}, {1}}
---*)
