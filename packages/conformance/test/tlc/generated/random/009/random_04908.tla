(*---
description: Evaluates a random set expression, seed 262, number 4908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b7639 \in DOMAIN <<5, 6>> : ([a |-> 1] = [a |-> 1, b |-> TRUE])} .. ((CHOOSE b7640 \in {2, 1, 3} : TRUE) - (1..3 \ 2..1))), (({2, 7} \cap (Nat \cup 2..1)) \cap ((Nat \cup <<>>) \cap {b7641 \in {} : TRUE}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04908 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
