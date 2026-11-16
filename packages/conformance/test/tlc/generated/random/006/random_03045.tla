(*---
description: Evaluates a random record expression, seed 262, number 3045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[Append(<<3, 1, 2>>, 1) EXCEPT !.a = @ + LET b4845 == 1 IN b4845] EXCEPT !.a = ((CHOOSE f \in [{1, 2} -> {}] : TRUE))[CASE FALSE -> 1 [] OTHER -> 2147483647]] EXCEPT !.a = (((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a * ((3 - 3) + (3 * 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03045 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
