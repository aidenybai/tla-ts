(*---
description: Evaluates a random int expression, seed 262, number 4613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b7224 == Head((<<2, -1>> \o <<1, 2147483647>>)) IN LET b7225 == ((CHOOSE f \in [{} -> {0} \cup {1}] : TRUE))[([a |-> 1, b |-> TRUE]).a] IN ((b7225 \div b7224) + Cardinality({x \in 1..3 : x > 1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04613 failed.
    Attempted to apply function:
    <<>>
    to argument 1, which is not in the domain of the function.
---*)
