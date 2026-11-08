(*---
description: Evaluates a random bool expression, seed 262, number 8804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((-b13640) % (FALSE - b13640)) : b13640 \in {IF TRUE THEN 7 ELSE b13641 : b13641 \in (2..1 \cup SUBSET {1})}} = (CASE (<<>> = [x \in Nat |-> x + 1]) -> Head(<<3, 1, 2>>) [] OTHER -> (7 % -1) :> CASE (SUBSET {1} \subseteq Nat) -> IF FALSE THEN 2 ELSE 7 [] OTHER -> CASE TRUE -> 7 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08804 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
