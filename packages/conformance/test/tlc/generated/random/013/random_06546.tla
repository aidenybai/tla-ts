(*---
description: Evaluates a random seq expression, seed 262, number 6546.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06546 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(<<(-1), IF TRUE THEN 1 ELSE -1>>, LAMBDA p, q : p < q), CASE ([[a |-> 1] EXCEPT !.a = @ + 2147483647] = (SUBSET {1} = (1 :> 2))) -> LET b10066 == CASE TRUE -> 2 [] OTHER -> -1 IN CASE FALSE -> 3 [] OTHER -> b10066 [] OTHER -> ((2..1 \ [a |-> 1]) * LET b10067 == 2 IN 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06546 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
