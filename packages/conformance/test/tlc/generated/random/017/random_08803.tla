(*---
description: Evaluates a random set expression, seed 262, number 8803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (1..3 \subseteq SUBSET {1}) THEN (b13638 \div b13638) ELSE (-7) : b13638 \in {(-1 \div -1), Len(<<1, 2>>)}} \cap {(Cardinality({1, 2}) * (-2147483647)) : b13639 \in DOMAIN (2 :> 7)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 103 to line 14, col 106 of module random_08803 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 100.
    | ExtendableExpr starting at line 14, column 99.
    | Expression starting at line 14, column 99.
    | Some { } form starting at line 14, column 98.
    | Fatal errors while parsing TLA+ spec in file random_08803
    | In module random_08803
    | Could not parse module random_08803 from file random_08803.tla
    | *** Errors: 1
    | In module random_08803
    | Could not parse module random_08803 from file random_08803.tla
    3002:1 Parsing or semantic analysis failed.
---*)
