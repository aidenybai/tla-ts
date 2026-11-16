(*---
description: Evaluates a random bool expression, seed 262, number 2835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SortSeq([a |-> 1, b |-> TRUE], LAMBDA p, q : p < q) \o [<<1, 2>> EXCEPT ![1] = 2]) = ((-1 - 7) :> (2147483647 % -1))) /\ (((0 .. 1..3) \cap {b4503 \in {2, 1, 3} : TRUE}) \subseteq (({} \ 2..1) \cup {2, 7}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 145 to line 14, col 146 of module random_02835 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 148.
    | ExtendableExpr starting at line 14, column 143.
    | Expression starting at line 14, column 143.
    | ExtendableExpr starting at line 14, column 142.
    | Expression starting at line 14, column 142.
    | Fatal errors while parsing TLA+ spec in file random_02835
    | In module random_02835
    | Could not parse module random_02835 from file random_02835.tla
    | *** Errors: 1
    | In module random_02835
    | Could not parse module random_02835 from file random_02835.tla
    3002:1 Parsing or semantic analysis failed.
---*)
