(*---
description: Evaluates a random function expression, seed 262, number 4161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(LET b6550 == 1 IN b6550 :> CASE FALSE -> 2 [] OTHER -> -1) EXCEPT ![Len(SubSeq(<<3, 1, 2>>, 1, 1))] = LET b6551 == Head(<<1>>) IN (b6551 - 2)] EXCEPT ![(((CHOOSE f \in [{1, 2} -> 1..2] : TRUE) @@ (3 :> -1)))[(CHOOSE b6552 \in (SUBSET {1} \cup 1..3) : (Nat \subseteq SUBSET {1}))]] = (([b6553 \in {2, 1, 3} |-> 0])[Head(<<>>)] % Head(Append(<<1, 2>>, [x \in 1..2 |-> x])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04161 failed.
    Attempted to compare the set {} with the value:
    2
---*)
