(*---
description: Evaluates a random set expression, seed 262, number 3498.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03498 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((1..3 \cap {}) \subseteq DOMAIN <<1>>) -> (LET b5526 == -1 IN b5526 * (FALSE => TRUE)) [] OTHER -> (CHOOSE b5527 \in (Nat \cap Nat) : (<<3, 1, 2>> = <<>>)), Len(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), (-1), (<<5, 6>>)[-1]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03498 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
