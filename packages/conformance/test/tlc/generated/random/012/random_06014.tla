(*---
description: Evaluates a random set expression, seed 262, number 6014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(-7), LET b9260 == 3 IN -1}) .. (-([b9261 \in {} |-> [a |-> 1, b |-> TRUE]])[(2147483647 \div -1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 119 to line 14, col 122 of module random_06014 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | ExtendableExpr starting at line 14, column 107.
    | Expression starting at line 14, column 107.
    | Some [] Form starting at line 14, column 106.
    | Fatal errors while parsing TLA+ spec in file random_06014
    | In module random_06014
    | Could not parse module random_06014 from file random_06014.tla
    | *** Errors: 1
    | In module random_06014
    | Could not parse module random_06014 from file random_06014.tla
    3002:1 Parsing or semantic analysis failed.
---*)
