(*---
description: Evaluates a random seq expression, seed 262, number 6512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SelectSeq(<<3, 0>>, LAMBDA e : e > 0), ((-2147483647) + (-1 * 2)), (([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))[Head(<<3, 1, 2>>)]), (CHOOSE b10012 \in DOMAIN (CHOOSE f \in [{} -> 2..1] : TRUE) : ([<<>> EXCEPT ![1] = b10012] = (CHOOSE f \in [{} -> 1..2] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06512 failed.
    2178:0 Overflow when computing -2147483647+-2
---*)
