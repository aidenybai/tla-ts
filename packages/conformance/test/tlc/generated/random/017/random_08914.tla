(*---
description: Evaluates a random bool expression, seed 262, number 8914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b13816 \in (Cardinality(2..1) \cup DOMAIN <<5, 6>>) : (~(<<>> = [x \in 1..2 |-> x]))} = UNION {{(<<5, 6>>)[-1], Head(<<1>>)}, ((0 .. 7) \cup (3 .. 7))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08914 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
