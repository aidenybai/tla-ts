(*---
description: Evaluates a random int expression, seed 262, number 8523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [2..1 -> {}] : TRUE) @@ [<<>> EXCEPT ![SUBSET {1}] = 0]) @@ (IF TRUE THEN 7 ELSE 2147483647 :> (0 - 1))) @@ [a |-> Len(SelectSeq(<<>>, LAMBDA e : e > 0)), b |-> (Len(<<1>>) = {b13206 \in {1} : TRUE})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08523 failed.
    Attempted to access tuple at a non integral index: {{}, {1}}
---*)
