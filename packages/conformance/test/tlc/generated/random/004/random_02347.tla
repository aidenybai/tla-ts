(*---
description: Evaluates a random seq expression, seed 262, number 2347.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02347 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(([<<1, 2>> EXCEPT ![1] = 1] \o SubSeq(<<1>>, 0, 2)), ((CHOOSE b3720 \in SUBSET {1} : FALSE) * (2147483647 * -1)), ((0 \div 0) \div (7 - 2)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 134 to line 14, col 134 of module random_02347 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 123.
    | ExtendableExpr starting at line 14, column 122.
    | ExtendableExpr starting at line 14, column 82.
    | Expression starting at line 14, column 82.
    | Fatal errors while parsing TLA+ spec in file random_02347
    | In module random_02347
    | Could not parse module random_02347 from file random_02347.tla
    | *** Errors: 1
    | In module random_02347
    | Could not parse module random_02347 from file random_02347.tla
    3002:1 Parsing or semantic analysis failed.
---*)
