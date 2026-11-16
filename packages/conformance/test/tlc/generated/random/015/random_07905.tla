(*---
description: Evaluates a random bool expression, seed 262, number 7905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 .. 3) = (FALSE \cup {2, 1, 3})) \/ (\A b12198 \in DOMAIN (1 :> 2) : (\A b12199 \in SUBSET {1} : TRUE))) \/ ([Append(<<1>>, <<1>>) EXCEPT ![1] = CASE FALSE -> 0 [] OTHER -> 3] = ((3 :> 3) @@ (CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07905 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    FALSE
    are not both enumerable
---*)
