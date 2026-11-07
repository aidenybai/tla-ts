(*---
description: Evaluates a random set expression, seed 262, number 6380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9810 \in UNION {{LET b9811 == 2147483647 IN -1, (1 \div -1)}, ((2..1 \cap 2..1) \ UNION {{2, 1, 3}, {x \in 1..3 : x > 1}})} : (([a |-> b9810, b |-> TRUE]).a < (((1 :> 2) @@ [x \in Nat |-> x + 1]))[LET b9812 == b9810 IN b9812])})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 69 to line 14, col 72 of module random_06380 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | Some { } form starting at line 14, column 34.
    | Fatal errors while parsing TLA+ spec in file random_06380
    | In module random_06380
    | Could not parse module random_06380 from file random_06380.tla
    | *** Errors: 1
    | In module random_06380
    | Could not parse module random_06380 from file random_06380.tla
    3002:1 Parsing or semantic analysis failed.
---*)
