(*---
description: Evaluates a random seq expression, seed 262, number 8953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((<<LET b13891 == 7 IN 2147483647, (3 * -1)>> \o <<(3 % 1), (2 - 7)>>), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 61 to line 14, col 61 of module random_08953 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 59.
    | Expression starting at line 14, column 59.
    | ExtendableExpr starting at line 14, column 58.
    | Expression starting at line 14, column 58.
    | Some << -- >> or >>_ Form starting at line 14, column 25.
    | Fatal errors while parsing TLA+ spec in file random_08953
    | In module random_08953
    | Could not parse module random_08953 from file random_08953.tla
    | *** Errors: 1
    | In module random_08953
    | Could not parse module random_08953 from file random_08953.tla
    3002:1 Parsing or semantic analysis failed.
---*)
