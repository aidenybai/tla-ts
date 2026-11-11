(*---
description: Evaluates a random int expression, seed 262, number 5433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((Tail(Append(<<3, 1, 2>>, 7)) \o <<(2147483647 \div 3), (7 * -1)>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 80 to line 14, col 80 of module random_05433 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 78.
    | Expression starting at line 14, column 78.
    | ExtendableExpr starting at line 14, column 77.
    | Expression starting at line 14, column 77.
    | Some << -- >> or >>_ Form starting at line 14, column 54.
    | Fatal errors while parsing TLA+ spec in file random_05433
    | In module random_05433
    | Could not parse module random_05433 from file random_05433.tla
    | *** Errors: 1
    | In module random_05433
    | Could not parse module random_05433 from file random_05433.tla
    3002:1 Parsing or semantic analysis failed.
---*)
