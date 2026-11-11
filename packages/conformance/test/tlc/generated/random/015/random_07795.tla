(*---
description: Evaluates a random int expression, seed 262, number 7795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a - {b12021 \in [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + ([x \in 1..2 |-> x])[3]] : (\A b12022 \in (<<1>> \ {x \in 1..3 : x > 1}) : (b12022 = 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07795 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
