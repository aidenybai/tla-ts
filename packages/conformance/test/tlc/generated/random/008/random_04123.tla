(*---
description: Evaluates a random set expression, seed 262, number 4123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b6477 \in (UNION {[a |-> 1, b |-> TRUE], {1, 2}} \cup {2, -1}) : (<<b6477, b6477>> = (CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE))}, {b6478 \in {(-[a |-> 1, b |-> TRUE]), (-7)} : (({x \in 1..3 : x > 1} \ {}) \subseteq ({1, 2} \cup b6478))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04123 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
