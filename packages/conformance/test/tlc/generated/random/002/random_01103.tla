(*---
description: Evaluates a random set expression, seed 262, number 1103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((b1757 \div 3) % (2 * b1757)) \div ((-1 \div 0) % (b1757 * 0))) : b1757 \in DOMAIN [SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![(7 \div -1)] = (<<5, 6>>)[3]]})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 151 to line 14, col 154 of module random_01103 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 149.
    | Expression starting at line 14, column 149.
    | ExtendableExpr starting at line 14, column 148.
    | Expression starting at line 14, column 148.
    | Except Component starting at line 14, column 147.
    | Fatal errors while parsing TLA+ spec in file random_01103
    | In module random_01103
    | Could not parse module random_01103 from file random_01103.tla
    | *** Errors: 1
    | In module random_01103
    | Could not parse module random_01103 from file random_01103.tla
    3002:1 Parsing or semantic analysis failed.
---*)
