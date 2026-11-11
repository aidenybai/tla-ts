(*---
description: Evaluates a random seq expression, seed 262, number 6583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<((7 * 7) \div (2 * 2)), IF [<<1>> EXCEPT ![1] = 2] THEN ((1 :> 2) @@ (1 :> 2)) ELSE (1 * 7)>>, [(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = ((0 \div 7) % (2 + 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06583 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 49 to line 14, col 115 of module random_06583
---*)
