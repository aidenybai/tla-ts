(*---
description: Evaluates a random seq expression, seed 262, number 4933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq((IF FALSE THEN 2147483647 ELSE 1 - (2 * 1)), LAMBDA p, q : p < q), (-Len(Append(<<>>, 0))), (((2147483647 * -1) % (-2147483647)) * SortSeq((CHOOSE b7671 \in 1..3 : TRUE), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 137 to line 14, col 137 of module random_04933 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 124.
    | Fatal errors while parsing TLA+ spec in file random_04933
    | In module random_04933
    | Could not parse module random_04933 from file random_04933.tla
    | *** Errors: 1
    | In module random_04933
    | Could not parse module random_04933 from file random_04933.tla
    3002:1 Parsing or semantic analysis failed.
---*)
