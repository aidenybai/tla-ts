(*---
description: Evaluates a random record expression, seed 262, number 7975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((-1 * 1))[Cardinality(2..1)], b |-> (\A b12319 \in (0 \cap {x \in 1..3 : x > 1}) : (<<3, 1, 2>> \subseteq SUBSET {1}))] EXCEPT !.a = (((1 + 1) - Cardinality({1, 2})) % Head((<<1>> \o <<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07975 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 24 to line 14, col 52 of module random_07975
---*)
