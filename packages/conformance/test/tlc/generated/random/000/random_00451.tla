(*---
description: Evaluates a random int expression, seed 262, number 451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b742 \in ((Append(<<1, 2>>, -1) = (CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE)) \ ((3 .. -1) \cup (Nat \cup 1..3))) : (CASE (TRUE \/ TRUE) -> LET b743 == [a |-> 1, b |-> TRUE] IN b742 [] OTHER -> LET b744 == b742 IN 0 = Len((<<1>> \o <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00451 failed.
    Attempted to enumerate S \ T when S:
    FALSE
    is not enumerable.
---*)
