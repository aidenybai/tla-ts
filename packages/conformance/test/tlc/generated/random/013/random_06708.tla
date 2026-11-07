(*---
description: Evaluates a random seq expression, seed 262, number 6708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((Append((\E b10281 \in SUBSET {1} : TRUE), (CHOOSE r \in [a : {}] : TRUE)) \o SubSeq(SubSeq(<<3, 1, 2>>, 3, -1), (7 + 2147483647), (1 \div 3))), (CHOOSE b10282 \in ({b10283 : b10283 \in 2..1} \cup {b10284 \in {1, 2} : TRUE}) : (([x \in 1..2 |-> x])[0] \in {[a |-> 1] : b10285 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06708 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 67 to line 14, col 94 of module random_06708
---*)
