(*---
description: Evaluates a random bool expression, seed 262, number 7006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10738 \in (({b10739 \in {} : TRUE} \ UNION {[a |-> 1], 2..1}) \ (<<-1, 2147483647>> \cap UNION {{x \in 1..3 : x > 1}, {1}})) : (CASE (TRUE /\ TRUE) -> CASE FALSE -> b10738 [] OTHER -> 0 [] OTHER -> (CHOOSE b10740 \in 2..1 : TRUE) \in UNION {({2, 1, 3} \cap {2, 1, 3}), (b10738 .. 0)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07006 failed.
    Attempted to check set membership in a tuple value.
---*)
