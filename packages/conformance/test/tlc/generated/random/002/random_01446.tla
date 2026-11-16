(*---
description: Evaluates a random int expression, seed 262, number 1446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2315 \in {b2316 \in {2, 3} : ([a |-> 1, b |-> TRUE] = [a |-> 1])} |-> (IF TRUE THEN b2315 ELSE 0 \div (3 * {}))])[Cardinality(((Nat \cup SUBSET {1}) \ UNION {{}, {2, 1, 3}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01446 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    {{}, {1}}
    are not both enumerable
---*)
