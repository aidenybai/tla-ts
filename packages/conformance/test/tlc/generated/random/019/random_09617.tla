(*---
description: Evaluates a random bool expression, seed 262, number 9617.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09617 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14931 \in ((UNION {1..3, 1..3} \cap {2147483647, <<>>}) \cup DOMAIN SelectSeq(<<>>, LAMBDA e : e > 0)) : (\E b14932 \in (Head(FALSE) \ UNION {{1, 2}, {}}) : ({b14933 \in 1..3 : (1 :> 2)} \subseteq ({1, 2} \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09617 failed.
    Attempted to check if the value:
    <<>>
    is in the integer interval 1..3
---*)
