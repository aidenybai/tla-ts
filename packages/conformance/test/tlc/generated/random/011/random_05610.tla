(*---
description: Evaluates a random record expression, seed 262, number 5610.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05610 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Cardinality((SUBSET {1} \cup {1, 2})) + (IF TRUE THEN -1 ELSE -1 * IF TRUE THEN [a |-> 1] ELSE 3)), b |-> (\E b8683 \in {b8684 \in ({1, 2} = {2, 1, 3}) : (TRUE => TRUE)} : (UNION {{2, 1, 3}, {}} = DOMAIN <<5, 6>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05610 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    2
---*)
