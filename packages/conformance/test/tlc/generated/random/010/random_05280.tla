(*---
description: Evaluates a random set expression, seed 262, number 5280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN (CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE) \cup ((1 .. -1) \cap (2..1 \ {1}))), {b8173 \in ((-1) .. LET b8174 == 2147483647 IN b8174) : (\E b8175 \in ({1, 2} \cup 2..1) : (FALSE <=> FALSE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05280 failed.
    Attempted to construct a set with too many elements (>1000000).
---*)
