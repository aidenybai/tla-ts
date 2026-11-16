(*---
description: Evaluates a random set expression, seed 262, number 8532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> LET b13219 == 0 IN 7, b |-> (\A b13220 \in {x \in 1..3 : x > 1} : FALSE)]).a, (Head((<<1>> \o <<1>>)) \div (CHOOSE b13221 \in {(1 :> 2) : b13222 \in {}} : (~TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08532 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 186 of module random_08532
---*)
