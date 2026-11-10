(*---
description: Evaluates a random set expression, seed 262, number 3543.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03543 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b5601 \in UNION {({} \ {x \in 1..3 : x > 1}), {1, 2147483647}} : ((2 \in {x \in 1..3 : x > 1}) => (b5601 \in {x \in 1..3 : x > 1}))}, (((CHOOSE b5602 \in {2, 1, 3} : TRUE) .. (<<5, 6>>)[-1]) \cap {LET b5604 == b5603 IN 1 : b5603 \in UNION {{2, 1, 3}, {x \in 1..3 : x > 1}}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03543 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
