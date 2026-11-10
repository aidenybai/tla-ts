(*---
description: Evaluates a random record expression, seed 262, number 1909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + [(<<3, 1, 2>> :> -1) EXCEPT ![(2147483647 - 7)] = Cardinality(SUBSET {1})]] EXCEPT !.a = (LET b2997 == (7 % 7) IN (b2997 % [a |-> 1]) - ([[a |-> 1] EXCEPT !.a = {1}]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01909 failed.
    Attempted to check equality of the function <<3, 1, 2>> with the value:
    2147483640
---*)
