(*---
description: Evaluates a random function expression, seed 262, number 9611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14923 \in ({(b14924 - b14924) : b14924 \in {b14925 : b14925 \in 2..1}} \ DOMAIN (7 :> 7)) |-> (DOMAIN (b14923 :> 1) + (([a |-> 1] = [a |-> 1, b |-> TRUE]) * (3 - 2)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 113 to line 14, col 118 of module random_09611 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 120.
    | Expression starting at line 14, column 113.
    | ExtendableExpr starting at line 14, column 112.
    | Expression starting at line 14, column 112.
    | Some [] Form starting at line 14, column 16.
    | Fatal errors while parsing TLA+ spec in file random_09611
    | In module random_09611
    | Could not parse module random_09611 from file random_09611.tla
    | *** Errors: 1
    | In module random_09611
    | Could not parse module random_09611 from file random_09611.tla
    3002:1 Parsing or semantic analysis failed.
---*)
