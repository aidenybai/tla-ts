(*---
description: Evaluates a random set expression, seed 262, number 6148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Head(<<1, 2>>) + (-1)) * (CHOOSE b9455 \in {-1 : b9456 \in 2..1} : (\A b9457 \in {} : [a |-> 1, b |-> TRUE]))), (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + {x \in 1..3 : x > 1}]).a % Head((<<>> \o <<1>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06148 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 45 to line 14, col 126 of module random_06148
---*)
