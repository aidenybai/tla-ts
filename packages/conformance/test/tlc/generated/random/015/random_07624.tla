(*---
description: Evaluates a random function expression, seed 262, number 7624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11730 \in ({Len(<<3, 1, 2>>), IF 1..3 THEN 2147483647 ELSE 7} \cap (CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE)) |-> (((~TRUE) => (FALSE /\ TRUE)) <=> (\A b11731 \in (b11730 .. 7) : ({1, 2} = {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07624 failed.
    A non-boolean expression (a set of the form i..j) was used as the condition of an IF.
    line 14, col 48 to line 14, col 77 of module random_07624
---*)
