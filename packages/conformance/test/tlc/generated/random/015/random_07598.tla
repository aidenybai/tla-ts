(*---
description: Evaluates a random bool expression, seed 262, number 7598.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07598 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b11689 == (\A b11690 \in <<5, 6>> : FALSE) IN CASE FALSE -> b11689 [] OTHER -> b11689 \cup ((TRUE - 1) = ([a |-> 1]).a)) = {([b11691 \in SUBSET {1} |-> -1])[Head(<<>>)], [a |-> ((1 :> 2) @@ [x \in 1..2 |-> x]), b |-> ({} \cap {})]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07598 failed.
    TLC encountered a non-enumerable quantifier bound
    <<5, 6>>.
    line 14, col 47 to line 14, col 54 of module random_07598
---*)
