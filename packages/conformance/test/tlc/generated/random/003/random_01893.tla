(*---
description: Evaluates a random bool expression, seed 262, number 1893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b2973 \in ({0, -1} \ [a |-> 2147483647, b |-> FALSE]) : (\A b2974 \in (1..3 \cup {}) : ({1} \subseteq {}))) = (CHOOSE b2975 \in ({2147483647, <<1, 2>>} \cap (0 .. 0)) : ({b2975, b2975} \subseteq ({1} \ {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01893 failed.
    Attempted to check if element:
    0
    is in the record:
    [a |-> 2147483647, b |-> FALSE]
---*)
