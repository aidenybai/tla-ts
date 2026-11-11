(*---
description: Evaluates a random record expression, seed 262, number 1513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SubSeq(Append(FALSE, 3), Cardinality(2..1), (-1 + {2, 1, 3}))), LET b2409 == (CHOOSE b2410 \in UNION {{x \in 1..3 : x > 1}, {1, 2}} : (b2410 \in {1})) IN CASE (TRUE /\ FALSE) -> (-0) [] OTHER -> ({1, 2} \ Nat)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01513 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    FALSE
---*)
