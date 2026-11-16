(*---
description: Evaluates a random seq expression, seed 262, number 5202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(<<(2147483647 \div -1), (-7)>>, ((2 % 7) \div Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 42 to line 14, col 45 of module random_05202 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 31.
    | Expression starting at line 14, column 31.
    | ExtendableExpr starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | Some << -- >> or >>_ Form starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_05202
    | In module random_05202
    | Could not parse module random_05202 from file random_05202.tla
    | *** Errors: 1
    | In module random_05202
    | Could not parse module random_05202 from file random_05202.tla
    3002:1 Parsing or semantic analysis failed.
---*)
