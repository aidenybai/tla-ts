(*---
description: Evaluates a random set expression, seed 262, number 8150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7, 1} \cup DOMAIN [x \in Nat |-> x + 1]) \ ({1, -1} \ {-1, 3})) \ ((([a |-> 1]).a \div ([a |-> 1]).a) .. Cardinality(({x \in 1..3 : x > 1} \ {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08150 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 7}
    and T:
    Nat
    are not both enumerable
---*)
