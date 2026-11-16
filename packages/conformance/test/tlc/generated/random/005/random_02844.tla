(*---
description: Evaluates a random set expression, seed 262, number 2844.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02844 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4510 \in (UNION {DOMAIN [x \in Nat |-> x + 1], {b4511 \in SUBSET {1} : TRUE}} \cap (Len(<<3, 1, 2>>) .. (2147483647 * <<1, 2>>))) : (UNION {{2 : b4512 \in [a |-> 1, b |-> TRUE]}, (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)} \subseteq (UNION {Nat, {}} \cap (Nat \ 2..1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02844 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
