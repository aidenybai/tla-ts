(*---
description: Evaluates a random bool expression, seed 262, number 8732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13521 \in {LET b13523 == CASE FALSE -> b13522 [] OTHER -> 2 IN (1 + 7) : b13522 \in ((3 + 7) \cup (1..3 \ {x \in 1..3 : x > 1}))} : ((Cardinality(2..1) < (2147483647 + 1)) /\ (\E b13524 \in {b13521, 0} : (TRUE = <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08732 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    10
    are not both enumerable
---*)
