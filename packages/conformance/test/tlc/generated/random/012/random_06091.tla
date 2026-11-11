(*---
description: Evaluates a random seq expression, seed 262, number 6091.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((-1 * 0)).a % ([<<5, 6>> EXCEPT ![2] = -1] @@ (2 :> -1))), (CHOOSE b9376 \in Head(Append(<<1, 2>>, 2147483647)) : ((TRUE \/ FALSE) \/ (TRUE <=> FALSE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06091 failed.
    Attempted to select field "a" from a non-record value 0
    line 14, col 19 to line 14, col 30 of module random_06091
---*)
