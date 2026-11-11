(*---
description: Evaluates a random set expression, seed 262, number 2847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Append(<<1, 2>>, 1)) % (({1} \div -1) \div (1 % SUBSET {1}))) .. Head(Tail(SortSeq(<<>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 51 to line 14, col 54 of module random_02847 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 47.
    | Expression starting at line 14, column 47.
    | ExtendableExpr starting at line 14, column 46.
    | Expression starting at line 14, column 46.
    | ExtendableExpr starting at line 14, column 45.
    | Fatal errors while parsing TLA+ spec in file random_02847
    | In module random_02847
    | Could not parse module random_02847 from file random_02847.tla
    | *** Errors: 1
    | In module random_02847
    | Could not parse module random_02847 from file random_02847.tla
    3002:1 Parsing or semantic analysis failed.
---*)
