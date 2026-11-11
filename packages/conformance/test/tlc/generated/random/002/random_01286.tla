(*---
description: Evaluates a random set expression, seed 262, number 1286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE f \in [2..1 -> {1, 2}] : TRUE) @@ (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE)))[(-(2 - 0))], ((Len(<<1, 2>>) % (-7)) % Head(Append(<<3, 1, 2>>, 2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01286 failed.
    Attempted to apply function:
    <<>>
    to argument -2, which is not in the domain of the function.
---*)
