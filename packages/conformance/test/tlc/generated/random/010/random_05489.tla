(*---
description: Evaluates a random seq expression, seed 262, number 5489.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05489 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a |-> ({1, 7} + (SUBSET {1} - 2)), b |-> ((2147483647 % 2) = IF FALSE THEN 3 ELSE 7)], ((Cardinality(SUBSET {1}) % (2 % 3)) % Head(<<FALSE, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 41 to line 14, col 46 of module random_05489 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 48.
    | Expression starting at line 14, column 41.
    | ExtendableExpr starting at line 14, column 40.
    | ExtendableExpr starting at line 14, column 31.
    | Expression starting at line 14, column 31.
    | Fatal errors while parsing TLA+ spec in file random_05489
    | In module random_05489
    | Could not parse module random_05489 from file random_05489.tla
    | *** Errors: 1
    | In module random_05489
    | Could not parse module random_05489 from file random_05489.tla
    3002:1 Parsing or semantic analysis failed.
---*)
