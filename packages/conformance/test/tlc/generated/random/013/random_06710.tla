(*---
description: Evaluates a random seq expression, seed 262, number 6710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ([FALSE EXCEPT !.a = @ + 1] = ({} \cap {1})) -> ((TRUE <=> TRUE) \/ (~FALSE)) [] OTHER -> (Head(<<1>>) + Cardinality({x \in 1..3 : x > 1})), Cardinality(DOMAIN [<<5, 6>> EXCEPT ![7] = 3])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06710 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
