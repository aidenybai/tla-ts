(*---
description: Evaluates a random seq expression, seed 262, number 6179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(Append([<<3, 1, 2>> EXCEPT ![1] = 0], (CHOOSE b9507 \in {2, 1, 3} : TRUE)), LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<(3 - 3), (1 * -1)>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 154 to line 14, col 154 of module random_06179 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 152.
    | ExtendableExpr starting at line 14, column 151.
    | Expression starting at line 14, column 151.
    | Some << -- >> or >>_ Form starting at line 14, column 140.
    | Fatal errors while parsing TLA+ spec in file random_06179
    | In module random_06179
    | Could not parse module random_06179 from file random_06179.tla
    | *** Errors: 1
    | In module random_06179
    | Could not parse module random_06179 from file random_06179.tla
    3002:1 Parsing or semantic analysis failed.
---*)
