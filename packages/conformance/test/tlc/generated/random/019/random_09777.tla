(*---
description: Evaluates a random function expression, seed 262, number 9777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15178 \in ((CHOOSE b15179 \in ({1} \cap {1, 2}) : (-1 \in {x \in 1..3 : x > 1})) .. Len(Append(<<1, 2>>, 2))) |-> (Len((b15178 = 0)) + Len(<<b15178, b15178>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09777 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 96 of module random_09777
---*)
