(*---
description: Evaluates a random bool expression, seed 262, number 2738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-LET b4322 == b4321 IN [a |-> 1, b |-> TRUE]) : b4321 \in {([x \in 1..2 |-> x] - 1) : b4323 \in DOMAIN <<5, 6>>}} \subseteq DOMAIN ([[x \in 1..2 |-> x] EXCEPT ![<<>>] = 1] @@ [b4324 \in SUBSET {1} |-> 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02738 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
