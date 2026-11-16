(*---
description: Evaluates a random bool expression, seed 262, number 4176.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04176 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b6565 \in ({Len(<<3, 1, 2>>), Cardinality(2..1)} \cap {(7 \div -1), (0 \div 7)}) : ((CHOOSE r \in [a : {1}] : TRUE) = [a |-> (<<1>>)[3], b |-> (FALSE /\ FALSE)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 78 to line 14, col 81 of module random_04176 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 75.
    | Some { } form starting at line 14, column 74.
    | Fatal errors while parsing TLA+ spec in file random_04176
    | In module random_04176
    | Could not parse module random_04176 from file random_04176.tla
    | *** Errors: 1
    | In module random_04176
    | Could not parse module random_04176 from file random_04176.tla
    3002:1 Parsing or semantic analysis failed.
---*)
