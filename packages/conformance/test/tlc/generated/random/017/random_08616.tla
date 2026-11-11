(*---
description: Evaluates a random record expression, seed 262, number 8616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[(CHOOSE b13345 \in {1, 2} : TRUE)], b |-> ((0 - TRUE) = Cardinality(Nat))] EXCEPT !.a = @ + (CHOOSE b13346 \in DOMAIN (CHOOSE f \in [{1, 2} -> 1..2] : TRUE) : ((SUBSET {1} \subseteq 1..3) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08616 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
