(*---
description: Evaluates a random int expression, seed 262, number 7716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-Cardinality({})) % CASE (TRUE <=> TRUE) -> (3 - 2) [] OTHER -> {b11903 \in Nat : FALSE}) * Len(Append((3 :> 3), IF TRUE THEN 0 ELSE 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07716 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    (3 :> 3)
---*)
