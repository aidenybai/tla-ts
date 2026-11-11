(*---
description: Evaluates a random function expression, seed 262, number 276.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00276 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b467 \in {(Len(<<1, 2>>) \in (1..3 \cap Nat)), LET b468 == ({} \cap 1..3) IN (b468 - TRUE)} |-> (CHOOSE b469 \in (DOMAIN [x \in Nat |-> x + 1] \cup {b467, b467}) : (\A b470 \in (<<5, 6>> \cap Nat) : (FALSE => TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00276 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
