(*---
description: Evaluates a random set expression, seed 262, number 8460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = ([x \in 1..2 |-> x])[-1]], UNION {({2, 1, 3} \ {x \in 1..3 : x > 1}), ({} \cap {x \in 1..3 : x > 1})}}, DOMAIN [b13090 \in {0 : b13091 \in {}} |-> (-3)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08460 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
