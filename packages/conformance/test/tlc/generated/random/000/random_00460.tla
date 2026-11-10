(*---
description: Evaluates a random int expression, seed 262, number 460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({({3 : b761 \in SUBSET {1}} \cap (SUBSET {1} \cap SUBSET {1})), ((0 % 1) * (0 \div -1))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 106 to line 14, col 109 of module random_00460 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 104.
    | Expression starting at line 14, column 104.
    | ExtendableExpr starting at line 14, column 103.
    | ExtendableExpr starting at line 14, column 93.
    | Expression starting at line 14, column 93.
    | Fatal errors while parsing TLA+ spec in file random_00460
    | In module random_00460
    | Could not parse module random_00460 from file random_00460.tla
    | *** Errors: 1
    | In module random_00460
    | Could not parse module random_00460 from file random_00460.tla
    3002:1 Parsing or semantic analysis failed.
---*)
