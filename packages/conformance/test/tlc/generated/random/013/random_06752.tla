(*---
description: Evaluates a random int expression, seed 262, number 6752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(2 :> 0) EXCEPT ![LET b10345 == 3 IN 2] = Head(<<1>>)])[LET b10346 == LET b10347 == 1 IN b10347 IN LET b10348 == b10346 IN 0] % ((CASE FALSE -> 7 [] OTHER -> -1 * IF TRUE THEN 3 ELSE 2147483647) * ((CHOOSE b10349 \in {} : TRUE) - (CHOOSE b10350 \in 3 : <<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06752 failed.
    Attempted to apply function:
    (2 :> 1)
    to argument 0, which is not in the domain of the function.
---*)
