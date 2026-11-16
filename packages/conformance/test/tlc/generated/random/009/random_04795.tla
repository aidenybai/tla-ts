(*---
description: Evaluates a random bool expression, seed 262, number 4795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7482 \in (([(1 :> 2) EXCEPT ![3] = 7])[([x \in 1..2 |-> x])[0]] .. Cardinality(SubSeq(<<1, 2>>, -1, 2))) : ((({1, 2} \cup {x \in 1..3 : x > 1}) \cup (b7482 \ 2..1)) = {(CHOOSE b7483 \in Nat : TRUE), (b7482 + b7482)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 34 to line 14, col 39 of module random_04795
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04795 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
