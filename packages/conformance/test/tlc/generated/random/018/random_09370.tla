(*---
description: Evaluates a random bool expression, seed 262, number 9370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(FALSE \/ TRUE)) \/ (([a |-> 1, b |-> TRUE]).a = (0 * -1))) /\ (\E b14546 \in UNION {{b14547 \in {1} : 2}, ({x \in 1..3 : x > 1} \cup {})} : (DOMAIN (1 :> 2) = {b14546, b14546}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 72 to line 14, col 72 of module random_09370 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | ExtendableExpr starting at line 14, column 69.
    | ExtendableExpr starting at line 14, column 41.
    | Expression starting at line 14, column 41.
    | Fatal errors while parsing TLA+ spec in file random_09370
    | In module random_09370
    | Could not parse module random_09370 from file random_09370.tla
    | *** Errors: 1
    | In module random_09370
    | Could not parse module random_09370 from file random_09370.tla
    3002:1 Parsing or semantic analysis failed.
---*)
