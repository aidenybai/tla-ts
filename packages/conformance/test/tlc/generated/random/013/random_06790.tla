(*---
description: Evaluates a random set expression, seed 262, number 6790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head((Cardinality(1..3) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) : b10415 \in ((UNION {{1, 2}, 2..1} \cup {-1, 0}) \cup ({2147483647 : b10416 \in {x \in 1..3 : x > 1}} \cap DOMAIN [x \in 1..2 |-> x]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06790 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    3
---*)
