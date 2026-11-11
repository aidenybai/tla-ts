(*---
description: Evaluates a random set expression, seed 262, number 8364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {[a |-> 1, b |-> TRUE], DOMAIN (1 :> 2)} \ ((3 \div -1) .. Len(<<3, 1, 2>>))) \ ((LET b12939 == 2 IN b12939 % (2 * 3)) .. Cardinality(UNION {{1, 2}, Nat}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 71 to line 14, col 74 of module random_08364 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 69.
    | Expression starting at line 14, column 69.
    | ExtendableExpr starting at line 14, column 68.
    | Expression starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 67.
    | Fatal errors while parsing TLA+ spec in file random_08364
    | In module random_08364
    | Could not parse module random_08364 from file random_08364.tla
    | *** Errors: 1
    | In module random_08364
    | Could not parse module random_08364 from file random_08364.tla
    3002:1 Parsing or semantic analysis failed.
---*)
