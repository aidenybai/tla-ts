(*---
description: Evaluates a random set expression, seed 262, number 9890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((\E b15375 \in ({2, 1, 3} \cap Nat) : (FALSE <=> b15374)) * (CHOOSE b15376 \in (Nat \cup {1, 2}) : (\E b15377 \in {2, 1, 3} : TRUE))) : b15374 \in (LET b15378 == [[a |-> 1] EXCEPT !.a = 3] IN (2147483647 * 7) - (Len(<<1, 2>>) \div (-1 \div <<5, 6>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09890 failed.
    2178:0 Overflow when computing 2147483647*7
---*)
