(*---
description: Evaluates a random function expression, seed 262, number 2336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([IF (\A b3702 \in DOMAIN (1 :> 2) : ([a |-> 1] = [a |-> 1])) THEN Head(Append([x \in Nat |-> x + 1], 7)) ELSE ([<<5, 6>> EXCEPT ![-1] = 2147483647])[Head(<<>>)] EXCEPT ![IF (Cardinality(TRUE) = Head(<<3, 1, 2>>)) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a ELSE ([{x \in 1..3 : x > 1} EXCEPT !.a = 3]).a] = ((IF FALSE THEN 0 ELSE 2147483647 \div LET b3703 == 7 IN b3703) + (([a |-> 1, b |-> TRUE]).a + IF TRUE THEN 1 ELSE 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02336 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Append(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
