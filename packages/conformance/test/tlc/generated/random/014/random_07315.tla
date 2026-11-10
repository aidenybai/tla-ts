(*---
description: Evaluates a random int expression, seed 262, number 7315.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07315 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b11264 \in (2147483647 .. 0) |-> Head(<<1>>)] EXCEPT ![(-CASE TRUE -> -1 [] OTHER -> 2)] = Head((<<>> \o <<1>>))])[Cardinality(UNION {{b11265 : b11265 \in {x \in 1..3 : x > 1}}, (2..1 \ {2, 1, 3})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 63 of module random_07315
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07315 failed.
    In applying the function
    <<>>,
    the first argument is:
    2
    which is not in its domain.
---*)
