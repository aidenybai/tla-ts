(*---
description: Evaluates a random set expression, seed 262, number 7910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12202 \in (DOMAIN (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) \ DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE)) : ([a |-> ([x \in 1..2 |-> x])[b12202], b |-> (TRUE \/ TRUE)] = [[a |-> 0, b |-> FALSE] EXCEPT !.a = @ + (CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07910 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
