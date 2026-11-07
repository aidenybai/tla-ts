(*---
description: Evaluates a random set expression, seed 262, number 1241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b1991 \in UNION {{b1992 \in {b1993 \in {2, 1, 3} : TRUE} : ({1, 2} \subseteq 2..1)}, (([x \in 1..2 |-> x])[7] .. (1 % 3))} : (Head((<<1>> \o <<1, 2>>)) = Len(Append(<<3, 1, 2>>, b1991)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01241 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
