(*---
description: Evaluates a random set expression, seed 262, number 3142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((FALSE \/ TRUE) <=> (<<>> = <<5, 6>>)) .. (CHOOSE b5019 \in UNION {2..1, -1} : (TRUE => <<>>))), DOMAIN ((1 :> 2) @@ (CHOOSE f \in [2..1 -> {}] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03142 failed.
    Attempted to compare integer -1 with non-integer:
    {}
---*)
